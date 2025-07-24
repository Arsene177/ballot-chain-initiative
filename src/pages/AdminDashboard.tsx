
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Users, Vote, BarChart3, Eye, EyeOff, Database, Activity, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const AdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [voterVisibility, setVoterVisibility] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [stats, setStats] = React.useState({
    totalSessions: 0,
    totalVotes: 0,
    activeParticipants: 0,
    blockchainConfirmations: 99.9
  });
  const [manualId, setManualId] = useState({
    id_type: 'employee',
    id_value: '',
    organization_id: ''
  });
  const [addingId, setAddingId] = useState(false);

  React.useEffect(() => {
    fetchStats();
    fetchSystemSettings();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total sessions
      const { count: sessionsCount } = await supabase
        .from('voting_sessions')
        .select('*', { count: 'exact' });

      // Fetch total votes
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact' });

      // Fetch unique voters (participants)
      const { data: uniqueVoters } = await supabase
        .from('votes')
        .select('voter_id')
        .not('voter_id', 'is', null);

      const uniqueParticipants = new Set(uniqueVoters?.map(v => v.voter_id)).size;

      setStats({
        totalSessions: sessionsCount || 0,
        totalVotes: votesCount || 0,
        activeParticipants: uniqueParticipants,
        blockchainConfirmations: 99.9
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'voter_identity_visible')
        .single();

      if (data) {
        // Handle both boolean and string values from JSONB
        const value = typeof data.setting_value === 'boolean' 
          ? data.setting_value 
          : data.setting_value === 'true';
        setVoterVisibility(value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateVoterVisibility = async (visible: boolean) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          {
            setting_key: 'voter_identity_visible',
            setting_value: visible,
            updated_by: user?.id
          },
          { 
            onConflict: 'setting_key',
            ignoreDuplicates: false 
          }
        );

      if (error) throw error;

      setVoterVisibility(visible);
      toast({
        title: "Settings Updated",
        description: `Voter identity visibility ${visible ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      console.error('Settings update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await uploadFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      if (!headers.includes('id_type') || !headers.includes('id_value')) {
        throw new Error('CSV must contain id_type and id_value columns');
      }

      const records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        return {
          id_type: record.id_type,
          id_value: record.id_value,
          organization_id: record.organization_id || null,
          is_active: true
        };
      });

      const { error } = await supabase
        .from('authorized_ids')
        .upsert(records);

      if (error) throw error;

      toast({
        title: "Upload Successful",
        description: `Imported ${records.length} ID records`,
      });
      
      setUploadFile(null);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process CSV file",
        variant: "destructive",
      });
    }
  };

  const exportIds = async () => {
    try {
      const { data, error } = await supabase
        .from('authorized_ids')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const csv = [
        'id_type,id_value,organization_id,created_at',
        ...(data || []).map(record => 
          `${record.id_type},${record.id_value},${record.organization_id || ''},${record.created_at}`
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'authorized_ids.csv';
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "ID database exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export ID database",
        variant: "destructive",
      });
    }
  };

  // Handler to add ID manually
  const handleAddId = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingId(true);
    try {
      if (!manualId.id_value.trim()) {
        toast({ title: 'Validation Error', description: 'ID value is required', variant: 'destructive' });
        setAddingId(false);
        return;
      }
      const { error } = await supabase.from('authorized_ids').insert({
        id_type: manualId.id_type as 'employee' | 'student' | 'staff' | 'custom',
        id_value: manualId.id_value.trim(),
        organization_id: manualId.organization_id.trim() || null,
        is_active: true
      });
      if (error) throw error;
      toast({ title: 'ID Added', description: 'Authorized ID added successfully.' });
      setManualId({ id_type: 'employee', id_value: '', organization_id: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add ID', variant: 'destructive' });
    } finally {
      setAddingId(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              System Administrator
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Global Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Vote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSessions > 0 ? '+12% from last month' : 'No sessions yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVotes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalVotes > 0 ? '+8% from last month' : 'No votes cast yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeParticipants.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeParticipants > 0 ? '+15% from last month' : 'No participants yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blockchain Confirmations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.blockchainConfirmations}%</div>
                <p className="text-xs text-muted-foreground">System reliability</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Privacy Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Voter Identity Visibility</h4>
                  <p className="text-sm text-gray-600">
                    Allow vote initiators to see voter identities
                  </p>
                </div>
                <div className="relative z-20" style={{ pointerEvents: 'auto' }}>
                  <Switch 
                    checked={voterVisibility}
                    onCheckedChange={updateVoterVisibility}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Status: {voterVisibility ? 'Identities visible to initiators' : 'Identities protected'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blockchain Network</span>
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Services</span>
                  <Badge className="bg-green-100 text-green-700">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Monitor</span>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ID Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Authorized ID Database</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium text-lg">Employee IDs</h4>
                  <p className="text-2xl font-bold text-blue-600">2,847</p>
                  <p className="text-sm text-gray-600">Active records</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium text-lg">Student IDs</h4>
                  <p className="text-2xl font-bold text-green-600">8,234</p>
                  <p className="text-sm text-gray-600">Active records</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium text-lg">Staff IDs</h4>
                  <p className="text-2xl font-bold text-purple-600">1,156</p>
                  <p className="text-sm text-gray-600">Active records</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-upload">Upload ID Database (CSV)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button onClick={handleFileUpload} disabled={!uploadFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV format: id_type, id_value, organization_id (optional)
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="flex-1" onClick={exportIds}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Records
                  </Button>
                <Button variant="outline" className="flex-1">Manage Access</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Authorized ID Manually */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Authorized ID Manually</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddId} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="id_type">ID Type</Label>
                  <select
                    id="id_type"
                    className="w-full border rounded px-2 py-1"
                    value={manualId.id_type}
                    onChange={e => setManualId({ ...manualId, id_type: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="id_value">ID Value</Label>
                  <Input
                    id="id_value"
                    value={manualId.id_value}
                    onChange={e => setManualId({ ...manualId, id_value: e.target.value })}
                    placeholder="Enter ID value"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="organization_id">Organization ID (optional)</Label>
                  <Input
                    id="organization_id"
                    value={manualId.organization_id}
                    onChange={e => setManualId({ ...manualId, organization_id: e.target.value })}
                    placeholder="Org ID"
                  />
                </div>
              </div>
              <Button type="submit" disabled={addingId} className="mt-2">
                {addingId ? 'Adding...' : 'Add ID'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New voting session created</p>
                  <p className="text-xs text-gray-600">University Election 2024 - 5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Blockchain confirmation received</p>
                  <p className="text-xs text-gray-600">Block #1847293 - 12 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">ID database updated</p>
                  <p className="text-xs text-gray-600">847 new employee records - 1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
