import React from 'react';
import { 
  User, 
  Hospital, 
  Shield, 
  Bell, 
  Cpu, 
  Globe, 
  Database, 
  Palette, 
  History,
  Save,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your profile, hospital configuration, and system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="flex overflow-x-auto pb-2">
          <TabsList className="bg-white border p-1 h-12">
            <TabsTrigger value="profile" className="gap-2 px-4"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="hospital" className="gap-2 px-4"><Hospital className="w-4 h-4" /> Hospital</TabsTrigger>
            <TabsTrigger value="security" className="gap-2 px-4"><Shield className="w-4 h-4" /> Security</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 px-4"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="tokens" className="gap-2 px-4"><Cpu className="w-4 h-4" /> Smart Tokens</TabsTrigger>
            <TabsTrigger value="branding" className="gap-2 px-4"><Palette className="w-4 h-4" /> Branding</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and how others see you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-sm overflow-hidden relative group">
                  <img src="https://picsum.photos/seed/admin/200/200" alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white text-xs font-bold">Change</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Dr. Sarah Chen</h4>
                  <p className="text-sm text-slate-500">Super Admin • City General Hospital</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline">Remove Photo</Button>
                    <Button size="sm">Upload New</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <Input defaultValue="Dr. Sarah Chen" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <Input defaultValue="sarah.chen@citygen.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Phone Number</label>
                  <Input defaultValue="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Role</label>
                  <Input defaultValue="Super Admin" disabled />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
              <CardDescription>Set your preferred language and timezone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Language</label>
                  <select className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Hindi</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Timezone</label>
                  <select className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    <option>(GMT-05:00) Eastern Time</option>
                    <option>(GMT-08:00) Pacific Time</option>
                    <option>(GMT+00:00) London</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Configuration</CardTitle>
              <CardDescription>Manage departments, rooms, and queue rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900">Departments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DeptItem name="OPD - General" rooms={8} staff={12} />
                  <DeptItem name="Laboratory" rooms={4} staff={6} />
                  <DeptItem name="Radiology" rooms={3} staff={4} />
                  <DeptItem name="Pediatrics" rooms={5} staff={8} />
                  <Button variant="outline" className="h-24 border-dashed flex flex-col gap-2">
                    <PlusIcon className="w-6 h-6 text-slate-400" />
                    <span className="text-slate-500 font-medium">Add Department</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900">Queue Rules</h4>
                <div className="space-y-4">
                  <RuleToggle 
                    title="Priority Emergency Handling" 
                    description="Automatically move emergency tokens to the front of all queues." 
                    enabled={true} 
                  />
                  <RuleToggle 
                    title="Auto-Missed Token" 
                    description="Mark token as missed after 3 calls with no response." 
                    enabled={true} 
                  />
                  <RuleToggle 
                    title="Estimated Wait Time Buffer" 
                    description="Add a 5-minute buffer to all estimated wait time calculations." 
                    enabled={false} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeptItem({ name, rooms, staff }: any) {
  return (
    <div className="p-4 bg-white border rounded-xl hover:border-primary transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <h5 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{name}</h5>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex gap-3 text-xs text-slate-500">
        <span>{rooms} Rooms</span>
        <span>•</span>
        <span>{staff} Staff</span>
      </div>
    </div>
  );
}

function RuleToggle({ title, description, enabled }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex-1 pr-8">
        <p className="font-bold text-slate-900 text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <div className={cn(
        "w-12 h-6 rounded-full relative transition-colors cursor-pointer",
        enabled ? "bg-primary" : "bg-slate-300"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
          enabled ? "left-7" : "left-1"
        )} />
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
