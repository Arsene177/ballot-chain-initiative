
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Plus, Calendar, Users, Settings, Eye, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VotingSessionForm {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  accessType: 'public' | 'organization' | 'restricted';
  idVerificationType: 'employee' | 'student' | 'staff' | 'custom';
}

interface UserSession {
  id: string;
  title: string;
  description: string;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

const UserVotingSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);

        // Fetch vote counts for each session
        if (data) {
          const counts: Record<string, number> = {};
          for (const session of data) {
            const { count } = await supabase
              .from('votes')
              .select('*', { count: 'exact' })
              .eq('voting_session_id', session.id);
            counts[session.id] = count || 0;
          }
          setVoteCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching user sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSessions();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'ended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Loading your sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No voting sessions created yet. Create your first session below.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sessions.map((session) => (
        <Card key={session.id} className="border-green-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{session.title}</CardTitle>
              <Badge className={getStatusColor(session.status)}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{session.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Votes:</span>
                <span className="font-medium">{voteCounts[session.id] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Ends:</span>
                <span className="font-medium">
                  {new Date(session.end_time).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button className="w-full mt-4" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const VoteInitiator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [candidates, setCandidates] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VotingSessionForm>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    accessType: 'public',
    idVerificationType: 'employee'
  });

  const addCandidate = () => {
    setCandidates([...candidates, '']);
  };

  const updateCandidate = (index: number, value: string) => {
    const updated = [...candidates];
    updated[index] = value;
    setCandidates(updated);
  };

  const removeCandidateIfEmpty = (index: number) => {
    if (candidates[index] === '' && candidates.length > 1) {
      const updated = candidates.filter((_, i) => i !== index);
      setCandidates(updated);
    }
  };

  const handleInputChange = (field: keyof VotingSessionForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a voting title",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.startTime || !formData.endTime) {
      toast({
        title: "Validation Error", 
        description: "Please set both start and end times",
        variant: "destructive"
      });
      return false;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive"
      });
      return false;
    }

    const validCandidates = candidates.filter(c => c.trim() !== '');
    if (validCandidates.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please add at least 2 candidates",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const createVotingSession = async (isDraft: boolean = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a voting session",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Create voting session
      const { data: sessionData, error: sessionError } = await supabase
        .from('voting_sessions')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            creator_id: user.id,
            access_type: formData.accessType,
            id_verification_type: formData.idVerificationType,
            start_time: formData.startTime,
            end_time: formData.endTime,
            status: isDraft ? 'draft' : 'scheduled'
          }
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add candidates
      const validCandidates = candidates.filter(c => c.trim() !== '');
      const candidatesData = validCandidates.map((name, index) => ({
        voting_session_id: sessionData.id,
        name: name.trim(),
        position: index + 1
      }));

      const { error: candidatesError } = await supabase
        .from('candidates')
        .insert(candidatesData);

      if (candidatesError) throw candidatesError;

      toast({
        title: "Success!",
        description: `Voting session ${isDraft ? 'saved as draft' : 'created'} successfully`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        accessType: 'public',
        idVerificationType: 'employee'
      });
      setCandidates(['']);

    } catch (error) {
      console.error('Error creating voting session:', error);
      toast({
        title: "Error",
        description: "Failed to create voting session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = () => createVotingSession(false);
  const handleSaveDraft = () => createVotingSession(true);

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
                <Shield className="h-8 w-8 text-green-600" />
                <span className="text-xl font-bold text-gray-900">Vote Initiator</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Organization Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Voting Sessions</h2>
          <UserVotingSessions />
        </div>

        {/* Create New Session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create New Voting Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Voting Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter the voting session title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide details about what voters are deciding on"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Candidates */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Candidate List</Label>
              {candidates.map((candidate, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder={`Candidate ${index + 1}`}
                    value={candidate}
                    onChange={(e) => updateCandidate(index, e.target.value)}
                    onBlur={() => removeCandidateIfEmpty(index)}
                  />
                  {index === candidates.length - 1 && (
                    <Button type="button" onClick={addCandidate} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date & Time</Label>
                <Input 
                  id="start-date" 
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date & Time</Label>
                <Input 
                  id="end-date" 
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Privacy Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Privacy Settings</span>
              </Label>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="voting-type">Voting Access</Label>
                  <Select value={formData.accessType} onValueChange={(value) => handleInputChange('accessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select voting access type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Voting (Anyone can vote)</SelectItem>
                      <SelectItem value="organization">Organization Only</SelectItem>
                      <SelectItem value="restricted">Specific Members (ID Required)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="id-type">ID Verification Type</Label>
                  <Select value={formData.idVerificationType} onValueChange={(value) => handleInputChange('idVerificationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type for verification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee ID</SelectItem>
                      <SelectItem value="student">Student ID</SelectItem>
                      <SelectItem value="staff">Staff ID</SelectItem>
                      <SelectItem value="custom">Custom ID List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Preview */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Session Preview</span>
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Votes will be recorded on blockchain for transparency</p>
                <p>• Each wallet address limited to one vote per session</p>
                <p>• Results will be visible to you after voting ends</p>
                <p>• Voter identities protected unless admin enables visibility</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1" 
                onClick={handleCreateSession}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Voting Session'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoteInitiator;
