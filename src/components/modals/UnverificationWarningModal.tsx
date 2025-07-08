'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  AlertTriangle,
  User,
  Home,
  Users,
  Calendar,
  UserX,
  ExternalLink,
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react'

interface RoomAllocation {
  roomId: string
  roomName: string
  roomGender: string
  roomCapacity: number
  currentOccupancy: number
  roommates: string[]
  registrantName: string
  registrantGender: string
  allocationDate: string
  allocatedBy: string
}

interface Registration {
  id: string
  fullName: string
  gender: string
  dateOfBirth: string
  phoneNumber: string
  emailAddress: string
}

interface UnverificationWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (forceUnverify?: boolean) => void
  onGoToAccommodations: () => void
  loading: boolean
  hasRoomAllocation: boolean
  roomAllocation?: RoomAllocation
  registration?: Registration
  error?: string
}

export function UnverificationWarningModal({
  isOpen,
  onClose,
  onConfirm,
  onGoToAccommodations,
  loading,
  hasRoomAllocation,
  roomAllocation,
  registration,
  error
}: UnverificationWarningModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) {
      return 'Unknown'
    }

    try {
      const today = new Date()
      const birthDate = new Date(dateOfBirth)

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        return 'Invalid Date'
      }

      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    } catch (error) {
      return 'Error'
    }
  }

  if (!registration) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 border-b border-red-100">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserX className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-apercu-bold text-lg text-gray-900">Unverify Registration</h3>
              <p className="font-apercu-regular text-sm text-red-600">
                {registration.fullName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-apercu-bold text-sm text-amber-800">Warning</h4>
                <p className="font-apercu-regular text-sm text-amber-700 mt-1">
                  This will mark the attendee as unverified and they will need to be verified again.
                </p>
              </div>
            </div>
          </div>
          {/* Room Allocation Warning */}
          {hasRoomAllocation && roomAllocation ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Home className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-apercu-bold text-sm text-red-800">Room Allocation Found</h4>
                  <p className="font-apercu-regular text-sm text-red-700 mt-1">
                    This attendee is allocated to <span className="font-apercu-medium">{roomAllocation.roomName}</span>.
                    Remove them from the room first.
                  </p>
                  <Button
                    onClick={onGoToAccommodations}
                    size="sm"
                    className="mt-3 bg-red-600 hover:bg-red-700 font-apercu-medium"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Accommodations
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-apercu-bold text-sm text-green-800">Ready to Unverify</h4>
                  <p className="font-apercu-regular text-sm text-green-700 mt-1">
                    This attendee will be marked as unverified and will need to be verified again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-apercu-bold text-sm text-red-800">Error</h4>
                  <p className="font-apercu-regular text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 font-apercu-medium"
            >
              Cancel
            </Button>

            {!hasRoomAllocation && (
              <Button
                onClick={() => onConfirm(false)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 font-apercu-medium"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Unverifying...
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Confirm Unverify
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
