import React, { useState } from 'react';
import {
  Button,
  Card,
  GlassCard,
  GlassDarkCard,
  SectionHeading,
  Badge,
  StatusBadge,
  Input,
  Select,
  Textarea,
  Modal,
  ToastContainer,
  ToastMessage,
  StepProgress,
  ProgressBar,
  LoadingSpinner,
  Skeleton,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Display,
  Heading,
  Subheading,
  Body,
  Caption,
  Label,
  DepthLayer,
} from './index';
import { Sparkles, ArrowRight, CheckCircle2, Search, Mail, Shield, UserCheck, Layers, Eye } from 'lucide-react';

export const DesignSystemShowcase: React.FC = () => {
  // Interactive States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressVal, setProgressVal] = useState(65);
  const [inputValue, setInputValue] = useState('');
  const [textareaVal, setTextareaVal] = useState('Innovative SR University student project details...');

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string) => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      type,
      title,
      description: `SR University Design Token trigger: ${new Date().toLocaleTimeString()}`,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="py-12 bg-slate-50/50 min-h-screen">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Design System Header */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 sru-depth-shadow-md text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#004182] border border-blue-100 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#004182]" />
            <span>PRAGATHI 2K26 Official UI Foundation</span>
          </div>
          <Display>Design System & Tokens</Display>
          <Body className="max-w-2xl mx-auto">
            SR University official design token library featuring high-contrast blue & white themes, accessible typography, 3D depth layers, and micro-interactions.
          </Body>
        </div>

        {/* 1. TYPOGRAPHY HIERARCHY */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Tokens"
            title="Typography Hierarchy"
            subtitle="Display, Heading, Subheading, Body, Caption and Label typography scales"
            align="left"
          />

          <Card variant="standard" padding="lg" className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <Label className="text-slate-400 block mb-1">Display (Syne Display Font)</Label>
              <Display className="text-3xl sm:text-4xl">PRAGATHI 2K26 EXPO</Display>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <Label className="text-slate-400 block mb-1">Heading (Syne Display Font)</Label>
              <Heading>National Level Project Exposition</Heading>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <Label className="text-slate-400 block mb-1">Subheading</Label>
              <Subheading>SR University • Warangal, Telangana</Subheading>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <Label className="text-slate-400 block mb-1">Body Text</Label>
              <Body>
                Bringing together visionaries, student engineers, researchers, and innovators under the theme “Innovate. Create. Inspire.”
              </Body>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <Label className="text-slate-400 block mb-1">Caption</Label>
                <Caption>09 October 2026 • Free SRU Student Registration</Caption>
              </div>
              <div>
                <Label className="text-slate-400 block mb-1">Label</Label>
                <Label className="text-[#004182]">FORM CONTROL LABEL</Label>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. BUTTON VARIANTS & INTERACTIONS */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Controls"
            title="Buttons & Micro-Interactions"
            subtitle="Subtle hover elevation, smooth color transitions, and press feedback"
            align="left"
          />

          <Card variant="standard" padding="lg" className="space-y-8">
            <div className="space-y-3">
              <Label>Variants</Label>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Primary Button
                </Button>
                <Button variant="secondary" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Secondary Button
                </Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Sizes</Label>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">
                  Small (sm)
                </Button>
                <Button variant="primary" size="md">
                  Medium (md)
                </Button>
                <Button variant="primary" size="lg">
                  Large (lg)
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Interactive & Loading States</Label>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" isLoading>
                  Submitting
                </Button>
                <Button variant="secondary" disabled>
                  Disabled Button
                </Button>
                <Button
                  variant="primary"
                  onClick={() => addToast('success', 'Button Clicked Successfully!')}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Trigger Toast Notification
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. CARDS & 3D DEPTH LAYERS */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Containers"
            title="Cards & 3D Depth Layers"
            subtitle="Lightweight 3D tilt, subtle shadows, and responsive glassmorphism"
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DepthLayer depthIntensity="medium">
              <Card variant="standard" padding="md" className="h-full space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <Subheading>Standard Card</Subheading>
                <Body className="text-xs">
                  Clean background with subtle 1px border, soft shadow, and hover elevation effect.
                </Body>
              </Card>
            </DepthLayer>

            <DepthLayer depthIntensity="high">
              <GlassCard padding="md" className="h-full space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#004182]/10 text-[#004182] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Subheading>Glass Card</Subheading>
                <Body className="text-xs">
                  Subtle backdrop blur layer reserved for hero highlights and floating UI components.
                </Body>
              </GlassCard>
            </DepthLayer>

            <DepthLayer depthIntensity="subtle">
              <GlassDarkCard padding="md" className="h-full space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <Subheading className="text-white">Dark Glass Card</Subheading>
                <p className="text-xs text-blue-100/80 leading-relaxed font-sans">
                  SR University Deep Blue variant for contrast emphasis and special callouts.
                </p>
              </GlassDarkCard>
            </DepthLayer>
          </div>
        </section>

        {/* 4. BADGES & STATUS INDICATORS */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Indicators"
            title="Badges & Status Badges"
            subtitle="Semantic tags and pulsing active status indicators"
            align="left"
          />

          <Card variant="standard" padding="lg" className="space-y-6">
            <div className="space-y-3">
              <Label>Standard Badges</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>
                  SR University
                </Badge>
                <Badge variant="neutral">School Student</Badge>
                <Badge variant="success">Free Registration</Badge>
                <Badge variant="warning">₹1,50,000 Prize Pool</Badge>
                <Badge variant="info">Warangal Venue</Badge>
                <Badge variant="purple">AI Innovation</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Status Badges with Pulsing Animation</Label>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="verified" label="SRU Student Verified" />
                <StatusBadge status="active" label="Registration Open" />
                <StatusBadge status="pending" label="Awaiting Screening" />
                <StatusBadge status="completed" label="Submission Approved" />
                <StatusBadge status="warning" label="Payment Pending" />
                <StatusBadge status="failed" label="Verification Failed" />
              </div>
            </div>
          </Card>
        </section>

        {/* 5. FORM CONTROLS */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Inputs"
            title="Form Controls"
            subtitle="Inputs, custom select dropdowns, textareas, with helper & error states"
            align="left"
          />

          <Card variant="standard" padding="lg" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Participant Email"
              placeholder="e.g. student@sru.edu.in"
              leftIcon={<Mail className="w-4 h-4" />}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="SR University students get free entry with @sru.edu.in email"
              required
            />

            <Input
              label="Roll Number (Error State Demo)"
              placeholder="e.g. 21SRU1042"
              error="Roll number must match official SR University student records"
              defaultValue="INVALID_ROLL"
              required
            />

            <Select
              label="Select Project Track"
              leftIcon={<Search className="w-4 h-4" />}
              options={[
                { value: 'ai', label: 'Artificial Intelligence & Data Science' },
                { value: 'robotics', label: 'Robotics & Automation' },
                { value: 'iot', label: 'IoT & Smart Cities' },
                { value: 'health', label: 'Healthcare & Biotech' },
              ]}
              helperText="Choose the primary domain of your prototype"
            />

            <Textarea
              label="Project Abstract"
              placeholder="Briefly describe your project..."
              value={textareaVal}
              onChange={(e) => setTextareaVal(e.target.value)}
              maxLength={250}
              showCount
              helperText="Maximum 250 characters"
            />
          </Card>
        </section>

        {/* 6. PROGRESS INDICATORS */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Feedback"
            title="Progress & Step Indicators"
            subtitle="Multi-step form trackers and animated percentage progress bars"
            align="left"
          />

          <Card variant="standard" padding="lg" className="space-y-8">
            <div className="space-y-4">
              <Label>Multi-Step Registration Flow</Label>
              <StepProgress
                steps={[
                  { id: 1, label: 'Team Details' },
                  { id: 2, label: 'SRU Verify' },
                  { id: 3, label: 'Project Abstract' },
                  { id: 4, label: 'Confirmation' },
                ]}
                currentStep={currentStep}
                onStepClick={(s) => setCurrentStep(s)}
              />
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                >
                  Previous Step
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                  disabled={currentStep === 3}
                >
                  Next Step
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Linear Progress Bar</Label>
              <ProgressBar
                progress={progressVal}
                label="Registration Capacity Filled"
              />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setProgressVal(25)}>
                  Set 25%
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setProgressVal(65)}>
                  Set 65%
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setProgressVal(100)}>
                  Set 100%
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 7. FEEDBACK STATES (LOADING, EMPTY, ERROR) */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="System States"
            title="Loading, Empty & Error States"
            subtitle="Robust feedback states for network requests and empty data tables"
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="standard" padding="md" className="space-y-4 text-center">
              <Label>Loading Spinner & Skeleton</Label>
              <LoadingSpinner size="md" text="Verifying SRU Credentials..." />
              <CardSkeleton />
            </Card>

            <EmptyState
              title="No Team Members Added"
              description="Click below to add up to 5 members for your PRAGATHI 2K26 project team."
              actionLabel="Add Member"
              onAction={() => addToast('info', 'Add Member clicked')}
            />

            <ErrorState
              title="Verification Error"
              message="Could not verify SR University student database record."
              details="HTTP 404: Email student@sru.edu.in not found in active roll register."
              onRetry={() => addToast('warning', 'Retrying verification...')}
            />
          </div>
        </section>

        {/* 8. MODAL & TOAST LAUNCHER */}
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Overlays"
            title="Modal Dialog & Toast Launcher"
            subtitle="Accessible overlays with backdrop blur and spring transitions"
            align="left"
          />

          <Card variant="standard" padding="lg" className="flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Open Sample Modal Dialog
            </Button>
            <Button
              variant="secondary"
              onClick={() => addToast('success', 'Registration Step Saved!')}
            >
              Trigger Success Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => addToast('error', 'SR University Email Required')}
            >
              Trigger Error Toast
            </Button>
          </Card>
        </section>
      </div>

      {/* SAMPLE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="SR University Student Verification"
        subtitle="Verification required for 100% free participant entry"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                addToast('success', 'SRU Verification Passed!');
              }}
            >
              Confirm Verification
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Body>
            Please confirm your SR University roll number and official university email ID ending with <code>@sru.edu.in</code>.
          </Body>
          <Input
            label="SRU Roll Number"
            placeholder="21SRU1042"
            defaultValue="21SRU1042"
          />
        </div>
      </Modal>
    </div>
  );
};
