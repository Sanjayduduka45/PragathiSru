from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set, Tuple
from app.database import db
from app.schemas.results import (
    IndividualEvaluation,
    ProjectResultItem,
    AwardWinnerItem,
    ThemeSummaryItem,
    ResultsStats,
    AdminResultsResponse,
    DeleteEvaluationResponse,
)

class ResultsService:
    @staticmethod
    def _extract_criterion_scores(row: Dict[str, Any]) -> Dict[str, float]:
        """
        Safely maps evaluation row data to the 5 official competition criteria:
        1. implementation: Working Model / Prototype / Implementation (mapped to legacy relevance_score)
        2. innovation: Innovation & Originality (innovation_score)
        3. technical: Technical / Conceptual Strength (technical_score)
        4. impact: Practical Applicability & Impact (impact_score)
        5. presentation: Presentation & Response to Jury (presentation_score)
        """
        crit_json = row.get("criteria_scores") or {}
        if not isinstance(crit_json, dict):
            crit_json = {}

        impl_val = crit_json.get("implementation")
        if impl_val is None:
            impl_val = crit_json.get("relevance")
        if impl_val is None:
            impl_val = row.get("relevance_score")
        impl = float(impl_val if impl_val is not None else 0.0)

        inno_val = crit_json.get("innovation")
        if inno_val is None:
            inno_val = row.get("innovation_score")
        inno = float(inno_val if inno_val is not None else 0.0)

        tech_val = crit_json.get("technical")
        if tech_val is None:
            tech_val = row.get("technical_score")
        tech = float(tech_val if tech_val is not None else 0.0)

        impact_val = crit_json.get("impact")
        if impact_val is None:
            impact_val = row.get("impact_score")
        impact = float(impact_val if impact_val is not None else 0.0)

        pres_val = crit_json.get("presentation")
        if pres_val is None:
            pres_val = row.get("presentation_score")
        pres = float(pres_val if pres_val is not None else 0.0)

        return {
            "implementation": round(impl, 2),
            "innovation": round(inno, 2),
            "technical": round(tech, 2),
            "impact": round(impact, 2),
            "presentation": round(pres, 2),
        }

    @staticmethod
    def _tie_break_tuple(criteria_averages: Dict[str, float]) -> Tuple[float, float, float, float, float]:
        """
        Official tie-breaking criteria priority order:
        1. Working Model / Prototype / Implementation
        2. Innovation & Originality
        3. Technical / Conceptual Strength
        4. Practical Applicability & Impact
        5. Presentation & Response to Jury
        """
        return (
            round(criteria_averages.get("implementation", 0.0), 4),
            round(criteria_averages.get("innovation", 0.0), 4),
            round(criteria_averages.get("technical", 0.0), 4),
            round(criteria_averages.get("impact", 0.0), 4),
            round(criteria_averages.get("presentation", 0.0), 4),
        )

    @staticmethod
    def _is_exact_overall_tie(p1: Dict[str, Any], p2: Dict[str, Any]) -> bool:
        """
        Exact tie check for Overall rankings:
        - Ranking score (merit_score) is identical
        AND
        - All five official criterion averages are identical
        """
        if p1.get("merit_score") is None or p2.get("merit_score") is None:
            return False
        if abs(p1["merit_score"] - p2["merit_score"]) >= 0.0001:
            return False
        crit1 = p1.get("criteria_averages") or {}
        crit2 = p2.get("criteria_averages") or {}
        for c in ["implementation", "innovation", "technical", "impact", "presentation"]:
            if abs(crit1.get(c, 0.0) - crit2.get(c, 0.0)) >= 0.0001:
                return False
        return True

    @staticmethod
    def _is_exact_theme_tie(p1: Dict[str, Any], p2: Dict[str, Any]) -> bool:
        """
        Exact tie check for Theme rankings:
        - Ranking score (raw_average) is identical
        AND
        - All five official criterion averages are identical
        """
        if abs(p1.get("raw_average", 0.0) - p2.get("raw_average", 0.0)) >= 0.0001:
            return False
        crit1 = p1.get("criteria_averages") or {}
        crit2 = p2.get("criteria_averages") or {}
        for c in ["implementation", "innovation", "technical", "impact", "presentation"]:
            if abs(crit1.get(c, 0.0) - crit2.get(c, 0.0)) >= 0.0001:
                return False
        return True

    @classmethod
    def _group_overall_clusters(cls, projects: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Groups contiguous projects with identical merit score and identical 5 criteria into clusters.
        """
        if not projects:
            return []
        clusters: List[List[Dict[str, Any]]] = [[projects[0]]]
        for p in projects[1:]:
            if cls._is_exact_overall_tie(p, clusters[-1][-1]):
                clusters[-1].append(p)
            else:
                clusters.append([p])
        return clusters

    @classmethod
    def _group_theme_clusters(cls, projects: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Groups contiguous theme candidate projects with identical raw average and identical 5 criteria into clusters.
        """
        if not projects:
            return []
        clusters: List[List[Dict[str, Any]]] = [[projects[0]]]
        for p in projects[1:]:
            if cls._is_exact_theme_tie(p, clusters[-1][-1]):
                clusters[-1].append(p)
            else:
                clusters.append([p])
        return clusters

    @classmethod
    async def get_admin_results(cls, is_final: bool = False) -> AdminResultsResponse:
        """
        Calculates authoritative Admin Results:
        - Phase A: Evaluation aggregation & project raw averages
        - Phase B: Eligibility evaluation (Provisional vs Final)
        - Phase C: Theme-wise Min-Max normalization
        - Phase D: 70/30 Overall Merit calculation
        - Phase E: Deterministic tie-breaking & ranking
        - Phase F: Prize allocation with strict exclusivity (no double dipping)
        """
        # 1. Fetch raw registrations and evaluations using privileged server connection
        regs_raw = await db.fetch_supabase(
            "registrations",
            "select=*,institutions(*),team_members(*),projects(*)&order=created_at.desc"
        )
        evals_raw = await db.fetch_supabase(
            "judge_evaluations",
            "select=*&order=created_at.desc"
        )

        if not regs_raw:
            regs_raw = []
        if not evals_raw:
            evals_raw = []

        # 2. Group evaluations by uppercase registration_id
        evals_by_reg: Dict[str, List[IndividualEvaluation]] = {}
        for r in evals_raw:
            reg_id = (r.get("registration_id") or "").strip().upper()
            if not reg_id:
                continue

            total_score = float(r.get("total_score") or 0.0)
            scores = cls._extract_criterion_scores(r)

            eval_item = IndividualEvaluation(
                id=str(r.get("id")),
                judge_id=str(r.get("judge_id") or f"judge-{r.get('judge_email')}"),
                judge_name=r.get("judge_name") or (r.get("judge_email") or "Jury").split("@")[0],
                judge_email=r.get("judge_email") or "",
                total_score=round(total_score, 2),
                scores=scores,
                comments=r.get("comments") or "",
                submitted_at=r.get("created_at") or datetime.now(timezone.utc).isoformat(),
            )

            if reg_id not in evals_by_reg:
                evals_by_reg[reg_id] = []
            evals_by_reg[reg_id].append(eval_item)

        # 3. Build project list & calculate Phase A + B (Raw Averages & Eligibility)
        projects: List[Dict[str, Any]] = []
        for reg in regs_raw:
            reg_id = (reg.get("registration_id") or "").strip().upper()
            proj_data = reg.get("projects")
            if isinstance(proj_data, list) and len(proj_data) > 0:
                proj_data = proj_data[0]
            elif not isinstance(proj_data, dict):
                proj_data = {}

            inst_data = reg.get("institutions")
            if isinstance(inst_data, list) and len(inst_data) > 0:
                inst_data = inst_data[0]
            elif not isinstance(inst_data, dict):
                inst_data = {}

            team_members_raw = reg.get("team_members") or []
            members = []
            for m in team_members_raw:
                members.append({
                    "name": m.get("name") or "",
                    "email": m.get("email") or "",
                    "phone": m.get("mobile") or "",
                    "role": "Leader" if m.get("is_team_leader") else "Member",
                    "rollNumber": m.get("roll_number"),
                    "department": m.get("department"),
                })

            leader_obj = next((m for m in members if m["role"] == "Leader"), None)
            leader_name = reg.get("leader_name") or (leader_obj["name"] if leader_obj else "Leader")

            evals = evals_by_reg.get(reg_id, [])
            evals_count = len(evals)

            # Pluggable Eligibility Architecture:
            # Currently (before Jury Assignment exists): projects with >= 1 evaluations are Provisional.
            # In future: eligibility will compare evals_count with assigned_jury_count.
            is_eligible = evals_count > 0
            status = "Provisional" if is_eligible else "Not Evaluated"

            if is_eligible:
                raw_avg = sum(e.total_score for e in evals) / evals_count
                criteria_avgs = {
                    "implementation": round(sum(e.scores["implementation"] for e in evals) / evals_count, 4),
                    "innovation": round(sum(e.scores["innovation"] for e in evals) / evals_count, 4),
                    "technical": round(sum(e.scores["technical"] for e in evals) / evals_count, 4),
                    "impact": round(sum(e.scores["impact"] for e in evals) / evals_count, 4),
                    "presentation": round(sum(e.scores["presentation"] for e in evals) / evals_count, 4),
                }
            else:
                raw_avg = 0.0
                criteria_avgs = {
                    "implementation": 0.0,
                    "innovation": 0.0,
                    "technical": 0.0,
                    "impact": 0.0,
                    "presentation": 0.0,
                }

            category = proj_data.get("category") or reg.get("category") or "General"

            projects.append({
                "registration_id": reg_id,
                "team_name": reg.get("team_name") or "Team",
                "project_title": proj_data.get("title") or "Project Title",
                "category": category,
                "institution_name": inst_data.get("name") or reg.get("institution_name") or "SR University",
                "leader_name": leader_name,
                "problem_statement": proj_data.get("problem_statement") or "",
                "proposed_solution": proj_data.get("proposed_solution") or "",
                "innovation": proj_data.get("innovation") or "",
                "members": members,
                "evaluations_count": evals_count,
                "raw_average": raw_avg,
                "criteria_averages": criteria_avgs,
                "theme_min": None,
                "theme_max": None,
                "normalized_score": None,
                "merit_score": None,
                "overall_rank": None,
                "theme_rank": None,
                "award": None,
                "award_type": None,
                "status": status,
                "is_eligible": is_eligible,
                "tie_status": "none",
                "evaluations": evals,
            })

        # 4. Phase C: Theme-Wise Min-Max Normalization
        themes_map: Dict[str, List[Dict[str, Any]]] = {}
        for p in projects:
            cat = p["category"]
            if cat not in themes_map:
                themes_map[cat] = []
            themes_map[cat].append(p)

        theme_summaries_dict: Dict[str, Dict[str, Any]] = {}

        for cat, theme_projects in themes_map.items():
            eligible_in_theme = [p for p in theme_projects if p["is_eligible"]]
            total_theme_count = len(theme_projects)
            evaluated_theme_count = len(eligible_in_theme)

            if evaluated_theme_count == 0:
                theme_summaries_dict[cat] = {
                    "category": cat,
                    "total_projects": total_theme_count,
                    "evaluated_projects": 0,
                    "theme_min": None,
                    "theme_max": None,
                }
                continue

            raw_scores = [p["raw_average"] for p in eligible_in_theme]
            theme_min = min(raw_scores)
            theme_max = max(raw_scores)

            theme_summaries_dict[cat] = {
                "category": cat,
                "total_projects": total_theme_count,
                "evaluated_projects": evaluated_theme_count,
                "theme_min": round(theme_min, 2),
                "theme_max": round(theme_max, 2),
            }

            for p in eligible_in_theme:
                p["theme_min"] = round(theme_min, 2)
                p["theme_max"] = round(theme_max, 2)

                # Edge case: single project or all identical scores in theme
                if theme_max == theme_min:
                    p["normalized_score"] = 100.00
                else:
                    norm = ((p["raw_average"] - theme_min) / (theme_max - theme_min)) * 100.0
                    p["normalized_score"] = round(max(0.0, min(100.0, norm)), 4)

        # 5. Phase D: 70% Normalized + 30% Raw Overall Merit Calculation
        for p in projects:
            if p["is_eligible"] and p["normalized_score"] is not None:
                merit = (0.70 * p["normalized_score"]) + (0.30 * p["raw_average"])
                p["merit_score"] = round(max(0.0, min(100.0, merit)), 4)

        # 6. Phase E: Overall Ranking & Official Tie-Breaking
        eligible_projects = [p for p in projects if p["is_eligible"]]

        # Sort eligible projects descending by Merit Score + 5 criteria tie-break
        eligible_projects.sort(
            key=lambda p: (
                p["merit_score"],
                p["criteria_averages"]["implementation"],
                p["criteria_averages"]["innovation"],
                p["criteria_averages"]["technical"],
                p["criteria_averages"]["impact"],
                p["criteria_averages"]["presentation"],
                p["raw_average"],
            ),
            reverse=True
        )

        # Assign Overall Rank to all eligible projects
        for i, p in enumerate(eligible_projects):
            p["overall_rank"] = i + 1

        # 7. Phase F: Award Allocation with Strict Prize Exclusivity & Exact-Tie Safety
        award_winners: List[AwardWinnerItem] = []
        overall_winner_reg_ids: Set[str] = set()

        overall_clusters = cls._group_overall_clusters(eligible_projects)

        # Flag all projects in multi-project clusters as committee_review_required
        for c in overall_clusters:
            if len(c) > 1:
                for p in c:
                    p["tie_status"] = "committee_review_required"

        # Position 1: Overall First Prize
        if len(overall_clusters) >= 1:
            c0 = overall_clusters[0]
            if len(c0) > 1:
                # Disputed tie for 1st place
                for p in c0:
                    p["award"] = "Tie — Result Committee Review Required"
                    p["award_type"] = "overall"
                    overall_winner_reg_ids.add(p["registration_id"])
                award_winners.append(AwardWinnerItem(
                    award_name="Overall First Prize",
                    award_scope="overall",
                    category="All Domains",
                    registration_id="TIE-REVIEW",
                    team_name="Tie — Result Committee Review Required",
                    project_title=f"Unresolved exact tie across {len(c0)} projects: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in c0),
                    raw_average=round(c0[0]["raw_average"], 2),
                    normalized_score=round(c0[0]["normalized_score"], 2) if c0[0]["normalized_score"] is not None else None,
                    merit_score=round(c0[0]["merit_score"], 2) if c0[0]["merit_score"] is not None else None,
                    overall_rank=1,
                    tie_status="committee_review_required",
                    is_disputed=True,
                    disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c0],
                ))
            else:
                p = c0[0]
                p["award"] = "Overall First Prize"
                p["award_type"] = "overall"
                overall_winner_reg_ids.add(p["registration_id"])
                award_winners.append(AwardWinnerItem(
                    award_name="Overall First Prize",
                    award_scope="overall",
                    category=p["category"],
                    registration_id=p["registration_id"],
                    team_name=p["team_name"],
                    project_title=p["project_title"],
                    raw_average=round(p["raw_average"], 2),
                    normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                    merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                    overall_rank=p["overall_rank"],
                    theme_rank=None,
                    tie_status=p["tie_status"],
                    is_disputed=False,
                ))

        # Position 2: Overall Second Prize
        if len(overall_clusters) >= 1:
            c0 = overall_clusters[0]
            if len(c0) == 2:
                # Exactly 2 projects tied across 1st and 2nd
                award_winners.append(AwardWinnerItem(
                    award_name="Overall Second Prize",
                    award_scope="overall",
                    category="All Domains",
                    registration_id="TIE-REVIEW",
                    team_name="Tie — Result Committee Review Required",
                    project_title=f"Unresolved exact tie across 2 projects covering 1st and 2nd place: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in c0),
                    raw_average=round(c0[0]["raw_average"], 2),
                    normalized_score=round(c0[0]["normalized_score"], 2) if c0[0]["normalized_score"] is not None else None,
                    merit_score=round(c0[0]["merit_score"], 2) if c0[0]["merit_score"] is not None else None,
                    overall_rank=2,
                    tie_status="committee_review_required",
                    is_disputed=True,
                    disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c0],
                ))
            elif len(c0) > 2:
                # >= 3 projects tied across 1st, 2nd, 3rd
                award_winners.append(AwardWinnerItem(
                    award_name="Overall Second Prize",
                    award_scope="overall",
                    category="All Domains",
                    registration_id="TIE-REVIEW",
                    team_name="Tie — Result Committee Review Required",
                    project_title=f"Unresolved exact tie across {len(c0)} projects covering 1st, 2nd, and 3rd place",
                    raw_average=round(c0[0]["raw_average"], 2),
                    normalized_score=round(c0[0]["normalized_score"], 2) if c0[0]["normalized_score"] is not None else None,
                    merit_score=round(c0[0]["merit_score"], 2) if c0[0]["merit_score"] is not None else None,
                    overall_rank=2,
                    tie_status="committee_review_required",
                    is_disputed=True,
                    disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c0],
                ))
            elif len(c0) == 1 and len(overall_clusters) >= 2:
                c1 = overall_clusters[1]
                if len(c1) > 1:
                    # Disputed tie for 2nd place
                    for p in c1:
                        p["award"] = "Tie — Result Committee Review Required"
                        p["award_type"] = "overall"
                        overall_winner_reg_ids.add(p["registration_id"])
                    award_winners.append(AwardWinnerItem(
                        award_name="Overall Second Prize",
                        award_scope="overall",
                        category="All Domains",
                        registration_id="TIE-REVIEW",
                        team_name="Tie — Result Committee Review Required",
                        project_title=f"Unresolved exact tie across {len(c1)} projects: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in c1),
                        raw_average=round(c1[0]["raw_average"], 2),
                        normalized_score=round(c1[0]["normalized_score"], 2) if c1[0]["normalized_score"] is not None else None,
                        merit_score=round(c1[0]["merit_score"], 2) if c1[0]["merit_score"] is not None else None,
                        overall_rank=2,
                        tie_status="committee_review_required",
                        is_disputed=True,
                        disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c1],
                    ))
                else:
                    p = c1[0]
                    p["award"] = "Overall Second Prize"
                    p["award_type"] = "overall"
                    overall_winner_reg_ids.add(p["registration_id"])
                    award_winners.append(AwardWinnerItem(
                        award_name="Overall Second Prize",
                        award_scope="overall",
                        category=p["category"],
                        registration_id=p["registration_id"],
                        team_name=p["team_name"],
                        project_title=p["project_title"],
                        raw_average=round(p["raw_average"], 2),
                        normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                        merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                        overall_rank=p["overall_rank"],
                        theme_rank=None,
                        tie_status=p["tie_status"],
                        is_disputed=False,
                    ))

        # Position 3: Overall Third Prize
        if len(overall_clusters) >= 1:
            c0 = overall_clusters[0]
            if len(c0) >= 3:
                # 3rd place was already disputed by c0
                award_winners.append(AwardWinnerItem(
                    award_name="Overall Third Prize",
                    award_scope="overall",
                    category="All Domains",
                    registration_id="TIE-REVIEW",
                    team_name="Tie — Result Committee Review Required",
                    project_title=f"Unresolved exact tie across {len(c0)} projects covering 1st, 2nd, and 3rd place",
                    raw_average=round(c0[0]["raw_average"], 2),
                    normalized_score=round(c0[0]["normalized_score"], 2) if c0[0]["normalized_score"] is not None else None,
                    merit_score=round(c0[0]["merit_score"], 2) if c0[0]["merit_score"] is not None else None,
                    overall_rank=3,
                    tie_status="committee_review_required",
                    is_disputed=True,
                    disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c0],
                ))
            elif len(c0) == 2 and len(overall_clusters) >= 2:
                # c0 has 2, so 3rd place is evaluated at c1
                c1 = overall_clusters[1]
                if len(c1) > 1:
                    # 3rd place boundary tie
                    for p in c1:
                        p["award"] = "Tie — Result Committee Review Required"
                        p["award_type"] = "overall"
                        overall_winner_reg_ids.add(p["registration_id"])
                    award_winners.append(AwardWinnerItem(
                        award_name="Overall Third Prize",
                        award_scope="overall",
                        category="All Domains",
                        registration_id="TIE-REVIEW",
                        team_name="Tie — Result Committee Review Required",
                        project_title=f"Unresolved exact tie across {len(c1)} projects at 3rd place boundary: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in c1),
                        raw_average=round(c1[0]["raw_average"], 2),
                        normalized_score=round(c1[0]["normalized_score"], 2) if c1[0]["normalized_score"] is not None else None,
                        merit_score=round(c1[0]["merit_score"], 2) if c1[0]["merit_score"] is not None else None,
                        overall_rank=3,
                        tie_status="committee_review_required",
                        is_disputed=True,
                        disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c1],
                    ))
                else:
                    p = c1[0]
                    p["award"] = "Overall Third Prize"
                    p["award_type"] = "overall"
                    overall_winner_reg_ids.add(p["registration_id"])
                    award_winners.append(AwardWinnerItem(
                        award_name="Overall Third Prize",
                        award_scope="overall",
                        category=p["category"],
                        registration_id=p["registration_id"],
                        team_name=p["team_name"],
                        project_title=p["project_title"],
                        raw_average=round(p["raw_average"], 2),
                        normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                        merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                        overall_rank=p["overall_rank"],
                        theme_rank=None,
                        tie_status=p["tie_status"],
                        is_disputed=False,
                    ))
            elif len(c0) == 1 and len(overall_clusters) >= 2:
                c1 = overall_clusters[1]
                if len(c1) >= 2:
                    # c1 covered 2nd and 3rd place
                    award_winners.append(AwardWinnerItem(
                        award_name="Overall Third Prize",
                        award_scope="overall",
                        category="All Domains",
                        registration_id="TIE-REVIEW",
                        team_name="Tie — Result Committee Review Required",
                        project_title=f"Unresolved exact tie across {len(c1)} projects covering 2nd and 3rd place: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in c1),
                        raw_average=round(c1[0]["raw_average"], 2),
                        normalized_score=round(c1[0]["normalized_score"], 2) if c1[0]["normalized_score"] is not None else None,
                        merit_score=round(c1[0]["merit_score"], 2) if c1[0]["merit_score"] is not None else None,
                        overall_rank=3,
                        tie_status="committee_review_required",
                        is_disputed=True,
                        disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c1],
                    ))
                elif len(c1) == 1 and len(overall_clusters) >= 3:
                    # c0 was 1st, c1 was 2nd, now evaluate c2 for 3rd place
                    c2 = overall_clusters[2]
                    if len(c2) > 1:
                        # Exact tie at Overall 3rd/4th boundary!
                        for p in c2:
                            p["award"] = "Tie — Result Committee Review Required"
                            p["award_type"] = "overall"
                            overall_winner_reg_ids.add(p["registration_id"])
                        award_winners.append(AwardWinnerItem(
                            award_name="Overall Third Prize",
                            award_scope="overall",
                            category="All Domains",
                            registration_id="TIE-REVIEW",
                            team_name="Tie — Result Committee Review Required",
                            project_title=f"Unresolved exact tie across {len(c2)} projects at 3rd place boundary: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in c2),
                            raw_average=round(c2[0]["raw_average"], 2),
                            normalized_score=round(c2[0]["normalized_score"], 2) if c2[0]["normalized_score"] is not None else None,
                            merit_score=round(c2[0]["merit_score"], 2) if c2[0]["merit_score"] is not None else None,
                            overall_rank=3,
                            tie_status="committee_review_required",
                            is_disputed=True,
                            disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in c2],
                        ))
                    else:
                        p = c2[0]
                        p["award"] = "Overall Third Prize"
                        p["award_type"] = "overall"
                        overall_winner_reg_ids.add(p["registration_id"])
                        award_winners.append(AwardWinnerItem(
                            award_name="Overall Third Prize",
                            award_scope="overall",
                            category=p["category"],
                            registration_id=p["registration_id"],
                            team_name=p["team_name"],
                            project_title=p["project_title"],
                            raw_average=round(p["raw_average"], 2),
                            normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                            merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                            overall_rank=p["overall_rank"],
                            theme_rank=None,
                            tie_status=p["tie_status"],
                            is_disputed=False,
                        ))

        # Theme Prizes based on RAW AVERAGE (Excluding Overall Winners!)
        theme_summary_items: List[ThemeSummaryItem] = []

        for cat, theme_projects in themes_map.items():
            eligible_in_theme = [p for p in theme_projects if p["is_eligible"]]

            # Sort theme projects by Raw Average + criteria tie-break
            eligible_in_theme.sort(
                key=lambda p: (
                    p["raw_average"],
                    p["criteria_averages"]["implementation"],
                    p["criteria_averages"]["innovation"],
                    p["criteria_averages"]["technical"],
                    p["criteria_averages"]["impact"],
                    p["criteria_averages"]["presentation"],
                ),
                reverse=True
            )

            # Assign theme_rank to all eligible projects in theme
            for idx, p in enumerate(eligible_in_theme):
                p["theme_rank"] = idx + 1

            # Filter out Overall Winners from Theme prize consideration (No Double Dipping)
            theme_prize_candidates = [
                p for p in eligible_in_theme if p["registration_id"] not in overall_winner_reg_ids
            ]

            theme_clusters = cls._group_theme_clusters(theme_prize_candidates)

            # Flag all projects in multi-project theme clusters as committee_review_required
            for c in theme_clusters:
                if len(c) > 1:
                    for p in c:
                        p["tie_status"] = "committee_review_required"

            theme_first_winner: Optional[AwardWinnerItem] = None
            theme_second_winner: Optional[AwardWinnerItem] = None

            # Theme First Prize
            if len(theme_clusters) >= 1:
                tc0 = theme_clusters[0]
                if len(tc0) > 1:
                    # Disputed exact tie for Theme First!
                    for p in tc0:
                        p["award"] = "Tie — Result Committee Review Required"
                        p["award_type"] = "theme"
                    theme_first_winner = AwardWinnerItem(
                        award_name=f"{cat} — Theme First Prize",
                        award_scope="theme",
                        category=cat,
                        registration_id="TIE-REVIEW",
                        team_name="Tie — Result Committee Review Required",
                        project_title=f"Unresolved exact tie across {len(tc0)} projects: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in tc0),
                        raw_average=round(tc0[0]["raw_average"], 2),
                        normalized_score=round(tc0[0]["normalized_score"], 2) if tc0[0]["normalized_score"] is not None else None,
                        merit_score=round(tc0[0]["merit_score"], 2) if tc0[0]["merit_score"] is not None else None,
                        overall_rank=tc0[0]["overall_rank"],
                        theme_rank=1,
                        tie_status="committee_review_required",
                        is_disputed=True,
                        disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in tc0],
                    )
                    award_winners.append(theme_first_winner)
                else:
                    p = tc0[0]
                    p["award"] = "Theme First Prize"
                    p["award_type"] = "theme"
                    theme_first_winner = AwardWinnerItem(
                        award_name=f"{cat} — Theme First Prize",
                        award_scope="theme",
                        category=cat,
                        registration_id=p["registration_id"],
                        team_name=p["team_name"],
                        project_title=p["project_title"],
                        raw_average=round(p["raw_average"], 2),
                        normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                        merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                        overall_rank=p["overall_rank"],
                        theme_rank=p["theme_rank"],
                        tie_status=p["tie_status"],
                        is_disputed=False,
                    )
                    award_winners.append(theme_first_winner)

            # Theme Second Prize
            if len(theme_clusters) >= 1:
                tc0 = theme_clusters[0]
                if len(tc0) == 2:
                    # tc0 had 2 projects tied across 1st and 2nd in theme
                    theme_second_winner = AwardWinnerItem(
                        award_name=f"{cat} — Theme Second Prize",
                        award_scope="theme",
                        category=cat,
                        registration_id="TIE-REVIEW",
                        team_name="Tie — Result Committee Review Required",
                        project_title=f"Unresolved exact tie across 2 projects covering 1st and 2nd in {cat}",
                        raw_average=round(tc0[0]["raw_average"], 2),
                        normalized_score=round(tc0[0]["normalized_score"], 2) if tc0[0]["normalized_score"] is not None else None,
                        merit_score=round(tc0[0]["merit_score"], 2) if tc0[0]["merit_score"] is not None else None,
                        overall_rank=tc0[0]["overall_rank"],
                        theme_rank=2,
                        tie_status="committee_review_required",
                        is_disputed=True,
                        disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in tc0],
                    )
                    award_winners.append(theme_second_winner)
                elif len(tc0) > 2:
                    theme_second_winner = AwardWinnerItem(
                        award_name=f"{cat} — Theme Second Prize",
                        award_scope="theme",
                        category=cat,
                        registration_id="TIE-REVIEW",
                        team_name="Tie — Result Committee Review Required",
                        project_title=f"Unresolved exact tie across {len(tc0)} projects covering 1st and 2nd in {cat}",
                        raw_average=round(tc0[0]["raw_average"], 2),
                        normalized_score=round(tc0[0]["normalized_score"], 2) if tc0[0]["normalized_score"] is not None else None,
                        merit_score=round(tc0[0]["merit_score"], 2) if tc0[0]["merit_score"] is not None else None,
                        overall_rank=tc0[0]["overall_rank"],
                        theme_rank=2,
                        tie_status="committee_review_required",
                        is_disputed=True,
                        disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in tc0],
                    )
                    award_winners.append(theme_second_winner)
                elif len(tc0) == 1 and len(theme_clusters) >= 2:
                    tc1 = theme_clusters[1]
                    if len(tc1) > 1:
                        # Exact tie at Theme Second boundary!
                        for p in tc1:
                            p["award"] = "Tie — Result Committee Review Required"
                            p["award_type"] = "theme"
                        theme_second_winner = AwardWinnerItem(
                            award_name=f"{cat} — Theme Second Prize",
                            award_scope="theme",
                            category=cat,
                            registration_id="TIE-REVIEW",
                            team_name="Tie — Result Committee Review Required",
                            project_title=f"Unresolved exact tie across {len(tc1)} projects at Theme Second boundary: " + ", ".join(f"{p['team_name']} ({p['registration_id']})" for p in tc1),
                            raw_average=round(tc1[0]["raw_average"], 2),
                            normalized_score=round(tc1[0]["normalized_score"], 2) if tc1[0]["normalized_score"] is not None else None,
                            merit_score=round(tc1[0]["merit_score"], 2) if tc1[0]["merit_score"] is not None else None,
                            overall_rank=tc1[0]["overall_rank"],
                            theme_rank=2,
                            tie_status="committee_review_required",
                            is_disputed=True,
                            disputed_teams=[{"registration_id": p["registration_id"], "team_name": p["team_name"]} for p in tc1],
                        )
                        award_winners.append(theme_second_winner)
                    else:
                        p = tc1[0]
                        p["award"] = "Theme Second Prize"
                        p["award_type"] = "theme"
                        theme_second_winner = AwardWinnerItem(
                            award_name=f"{cat} — Theme Second Prize",
                            award_scope="theme",
                            category=cat,
                            registration_id=p["registration_id"],
                            team_name=p["team_name"],
                            project_title=p["project_title"],
                            raw_average=round(p["raw_average"], 2),
                            normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                            merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                            overall_rank=p["overall_rank"],
                            theme_rank=p["theme_rank"],
                            tie_status=p["tie_status"],
                            is_disputed=False,
                        )
                        award_winners.append(theme_second_winner)

            summary_base = theme_summaries_dict.get(cat, {
                "category": cat,
                "total_projects": len(theme_projects),
                "evaluated_projects": len(eligible_in_theme),
                "theme_min": None,
                "theme_max": None,
            })

            theme_summary_items.append(ThemeSummaryItem(
                category=cat,
                total_projects=summary_base["total_projects"],
                evaluated_projects=summary_base["evaluated_projects"],
                theme_min=summary_base["theme_min"],
                theme_max=summary_base["theme_max"],
                theme_first=theme_first_winner,
                theme_second=theme_second_winner,
            ))

        # 8. Calculate Overall Stats
        total_projects_count = len(projects)
        evaluated_projects_count = len(eligible_projects)
        not_evaluated_count = total_projects_count - evaluated_projects_count
        total_evaluations_count = len(evals_raw)
        highest_raw = max((p["raw_average"] for p in eligible_projects), default=0.0)
        highest_merit = max((p["merit_score"] for p in eligible_projects if p["merit_score"] is not None), default=0.0)

        stats = ResultsStats(
            total_projects=total_projects_count,
            evaluated_projects=evaluated_projects_count,
            not_evaluated_projects=not_evaluated_count,
            total_evaluations=total_evaluations_count,
            highest_raw_score=round(highest_raw, 2),
            highest_merit_score=round(highest_merit, 2),
        )

        # 9. Format response objects with clean 2-decimal rounded values
        project_items: List[ProjectResultItem] = []
        for p in projects:
            project_items.append(ProjectResultItem(
                registration_id=p["registration_id"],
                team_name=p["team_name"],
                project_title=p["project_title"],
                category=p["category"],
                institution_name=p["institution_name"],
                leader_name=p["leader_name"],
                problem_statement=p["problem_statement"],
                proposed_solution=p["proposed_solution"],
                innovation=p["innovation"],
                members=p["members"],
                evaluations_count=p["evaluations_count"],
                raw_average=round(p["raw_average"], 2),
                criteria_averages={k: round(v, 2) for k, v in p["criteria_averages"].items()},
                theme_min=p["theme_min"],
                theme_max=p["theme_max"],
                normalized_score=round(p["normalized_score"], 2) if p["normalized_score"] is not None else None,
                merit_score=round(p["merit_score"], 2) if p["merit_score"] is not None else None,
                overall_rank=p["overall_rank"],
                theme_rank=p["theme_rank"],
                award=p["award"],
                award_type=p["award_type"],
                status=p["status"],
                is_eligible=p["is_eligible"],
                tie_status=p["tie_status"],
                evaluations=p["evaluations"],
            ))

        return AdminResultsResponse(
            success=True,
            mode="Provisional",
            notice=(
                "Provisional Results — calculated from currently submitted evaluations. "
                "Final eligibility will use assigned-jury completion after Jury Assignment is configured."
            ),
            stats=stats,
            themes=theme_summary_items,
            awards=award_winners,
            projects=project_items,
            calculated_at=datetime.now(timezone.utc).isoformat(),
        )

    @classmethod
    async def delete_evaluation(
        cls,
        evaluation_id: str,
        admin_user_id: Optional[str] = None,
        reset_reason: Optional[str] = None
    ) -> DeleteEvaluationResponse:
        """
        Atomically resets a single jury evaluation row:
        - Snapshots scores and metadata into public.evaluation_reset_audit
        - Deletes ONLY the specific row from public.judge_evaluations
        - Registrations, projects, teams, jury accounts, and other evaluations are untouched
        - Allows the jury to submit a fresh evaluation if needed
        - Results automatically recalculate on next fetch
        """
        eval_id_clean = evaluation_id.strip()
        if not eval_id_clean:
            raise ValueError("Evaluation ID is required.")

        from app.services.jury_service import jury_service
        res = await jury_service.atomic_reset_evaluation(
            eval_id_clean,
            admin_user_id=admin_user_id or "admin",
            reset_reason=reset_reason or "Administrative reset for re-evaluation"
        )

        return DeleteEvaluationResponse(
            success=True,
            message="Evaluation reset successfully.",
            deleted_id=eval_id_clean,
        )

results_service = ResultsService()
