"use client"

import { Settings, Palette, Bell, Database, User, Moon } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPaletteSelector } from "@/components/color-palette-selector"

export default function SettingsPage() {
  return (
    <SidebarInset className="bg-dark-bg">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-white hover:bg-dark-card" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-dark-border" />
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          <h1 className="text-lg font-semibold text-white">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-dark-card border border-dark-border">
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue"
            >
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink"
            >
              <Database className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
            >
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <ColorPaletteSelector />

            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Moon className="w-5 h-5 text-neon-purple" />
                  Theme Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize the overall appearance of the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Dark Mode</Label>
                    <p className="text-sm text-gray-400">Always enabled for optimal neon aesthetics</p>
                  </div>
                  <Switch checked disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Neon Effects</Label>
                    <p className="text-sm text-gray-400">Enable glowing effects and animations</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Reduced Motion</Label>
                    <p className="text-sm text-gray-400">Minimize animations for better performance</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Animation Speed</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border">
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-neon-green" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how you receive updates and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Market Alerts</Label>
                    <p className="text-sm text-gray-400">Get notified about significant market changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Competitor Updates</Label>
                    <p className="text-sm text-gray-400">Receive alerts about competitor activities</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Data Sync Notifications</Label>
                    <p className="text-sm text-gray-400">Get notified when data sources sync</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Notification Frequency</Label>
                  <Select defaultValue="realtime">
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border">
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-neon-pink" />
                  Data Management
                </CardTitle>
                <CardDescription className="text-gray-400">Configure data retention and sync settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Data Retention Period</Label>
                  <Select defaultValue="90days">
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border">
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="90days">90 Days</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Auto Sync Frequency</Label>
                  <Select defaultValue="hourly">
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border">
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Cache Data Locally</Label>
                    <p className="text-sm text-gray-400">Store data locally for faster loading</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="pt-4 border-t border-dark-border">
                  <Button variant="outline" className="border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10">
                    Clear All Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-neon-purple" />
                  Account Information
                </CardTitle>
                <CardDescription className="text-gray-400">Manage your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Display Name</Label>
                    <Input defaultValue="Gen Z User" className="bg-dark-bg border-dark-border text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Email</Label>
                    <Input defaultValue="user@example.com" className="bg-dark-bg border-dark-border text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Time Zone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border">
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="cet">Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>

                <div className="pt-4 border-t border-dark-border flex gap-2">
                  <Button className="bg-neon-purple/20 border border-neon-purple/50 text-neon-purple hover:bg-neon-purple/30">
                    Save Changes
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-gray-400">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
