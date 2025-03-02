"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export default function SendEmailPage() {
  // State for email arrays
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [cc, setCc] = useState<string[]>([""]);
  const [bcc, setBcc] = useState<string[]>([""]);
  
  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    // This would be replaced with actual form submission logic
    const subject = formData.get("subject") as string;
    const sender = formData.get("sender") as string;
    
    // Filter out empty emails
    const filteredRecipients = recipients.filter(email => email.trim() !== "");
    const filteredCc = cc.filter(email => email.trim() !== "");
    const filteredBcc = bcc.filter(email => email.trim() !== "");
    
    const body = formData.get("body") as string;
    
    // Log the form data for now
    console.log({
      subject,
      sender,
      recipients: filteredRecipients,
      cc: filteredCc,
      bcc: filteredBcc,
      body
    });
    
    // Here you would typically send this data to your backend
  };
  
  // Helper function to add a new email field
  const addEmailField = (
    emailArray: string[], 
    setEmailArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setEmailArray([...emailArray, ""]);
  };
  
  // Helper function to update an email field
  const updateEmailField = (
    index: number, 
    value: string, 
    emailArray: string[], 
    setEmailArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newArray = [...emailArray];
    newArray[index] = value;
    setEmailArray(newArray);
  };
  
  // Helper function to remove an email field
  const removeEmailField = (
    index: number, 
    emailArray: string[], 
    setEmailArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (emailArray.length > 1) {
      const newArray = [...emailArray];
      newArray.splice(index, 1);
      setEmailArray(newArray);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Send Email</h1>
        
        <form action={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              name="subject" 
              placeholder="Email subject" 
              required 
            />
          </div>
          
          {/* Sender */}
          <div className="space-y-2">
            <Label htmlFor="sender">From</Label>
            <Input 
              id="sender" 
              name="sender" 
              type="email" 
              placeholder="your@email.com" 
              required 
            />
          </div>
          
          {/* Recipients */}
          <div className="space-y-2">
            <Label>To</Label>
            {recipients.map((email, index) => (
              <div key={`recipient-${index}`} className="flex gap-2 mb-2">
                <Input 
                  value={email}
                  onChange={(e) => updateEmailField(index, e.target.value, recipients, setRecipients)}
                  placeholder="recipient@email.com"
                  type="email"
                  required={index === 0}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeEmailField(index, recipients, setRecipients)}
                  disabled={recipients.length === 1 && index === 0}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => addEmailField(recipients, setRecipients)}
            >
              + Add Recipient
            </Button>
          </div>
          
          {/* CC */}
          <div className="space-y-2">
            <Label>CC</Label>
            {cc.map((email, index) => (
              <div key={`cc-${index}`} className="flex gap-2 mb-2">
                <Input 
                  value={email}
                  onChange={(e) => updateEmailField(index, e.target.value, cc, setCc)}
                  placeholder="cc@email.com"
                  type="email"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeEmailField(index, cc, setCc)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => addEmailField(cc, setCc)}
            >
              + Add CC
            </Button>
          </div>
          
          {/* BCC */}
          <div className="space-y-2">
            <Label>BCC</Label>
            {bcc.map((email, index) => (
              <div key={`bcc-${index}`} className="flex gap-2 mb-2">
                <Input 
                  value={email}
                  onChange={(e) => updateEmailField(index, e.target.value, bcc, setBcc)}
                  placeholder="bcc@email.com"
                  type="email"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeEmailField(index, bcc, setBcc)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => addEmailField(bcc, setBcc)}
            >
              + Add BCC
            </Button>
          </div>
          
          {/* Email Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              name="body"
              rows={10}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Write your message here..."
              required
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <SubmitButton pendingText="Sending...">
              Send Email
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
