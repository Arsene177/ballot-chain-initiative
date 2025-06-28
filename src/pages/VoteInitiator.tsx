
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Plus, Calendar, Users, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const VoteInitiator = () => {
  const [candidates, setCandidates] = React.useState(['']);

  const addCandidate = () => {
    setCandidates([...candidates, '']);
  };

  const updateCandidate = (index: number, value: string) => {
    const updated = [...candidates];
    updated[index] = value;
    setCandidates(updated);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">University President Election</CardTitle>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Choose the next student body president</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Votes:</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ends:</span>
                    <span className="font-medium">Dec 15, 2024</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">View Results</Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Budget Allocation Vote</CardTitle>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Decide on next year's budget priorities</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Starts:</span>
                    <span className="font-medium">Jan 10, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">7 days</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">Edit Session</Button>
              </CardContent>
            </Card>
          </div>
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
                <Input id="title" placeholder="Enter the voting session title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide details about what voters are deciding on"
                  rows={3}
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
                <Input id="start-date" type="datetime-local" />
              </div>
              <div>
                <Label htmlFor="end-date">End Date & Time</Label>
                <Input id="end-date" type="datetime-local" />
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
                  <Select>
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
                  <Select>
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
              <Button className="flex-1">Create Voting Session</Button>
              <Button variant="outline" className="flex-1">Save as Draft</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoteInitiator;
