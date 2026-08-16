'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight, 
  Stethoscope,
  MapPin,
  Star
} from 'lucide-react';

// Sample available time slots
const TIME_SLOTS = [
  '09:00 AM', '09:45 AM', '10:30 AM', 
  '11:15 AM', '02:00 PM', '02:45 PM', 
  '03:30 PM', '04:15 PM'
];

const VISIT_TYPES = [
  { id: 'initial', title: 'Initial Rehabilitation Eval', duration: '45 min', price: '$150' },
  { id: 'followup', title: 'Follow-up Consultation', duration: '30 min', price: '$90' },
  { id: 'pain-mgmt', title: 'Pain Management Session', duration: '30 min', price: '$110' },
];

export default function DoctorBookingInterface() {
  const [selectedVisit, setSelectedVisit] = useState(VISIT_TYPES[0].id);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-12');
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Form state for patient info
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate Server Action / API endpoint call to Prisma
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsConfirmed(true);
    } catch (error) {
      console.error('Booking failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeService = VISIT_TYPES.find((v) => v.id === selectedVisit);

  if (isConfirmed) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">Appointment Requested!</h2>
        <p className="text-slate-600 mt-2 text-sm">
          A confirmation request has been sent. You will receive an email once Dr. Hamed’s office confirms your appointment.
        </p>
        <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left text-sm space-y-2 border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-500">Service:</span>
            <span className="font-medium text-slate-800">{activeService?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date & Time:</span>
            <span className="font-medium text-slate-800">{selectedDate} at {selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Patient:</span>
            <span className="font-medium text-slate-800">{formData.fullName}</span>
          </div>
        </div>
        <button
          onClick={() => setIsConfirmed(false)}
          className="mt-6 w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition"
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Doctor Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Dr. Sarah Jenkins, MD</h1>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                Physiatrist
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Physical Medicine & Rehabilitation Specialist</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                4.9 (128 reviews)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Medical Plaza, Suite 402
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Accepting new patients for physical rehab & pain management</span>
        </div>
      </div>

      {/* Main Booking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Step Selection */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Step 1: Visit Type */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Select Consultation Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VISIT_TYPES.map((type) => {
                const isSelected = selectedVisit === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedVisit(type.id)}
                    className={`p-4 rounded-xl text-left border transition relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="font-medium text-sm text-slate-900">{type.title}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                      <span>{type.duration}</span>
                      <span className="font-semibold text-slate-900">{type.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Date & Time Picker */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Choose Date & Time
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Available Time Slots
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Patient Information Form */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              Patient Details
            </h2>

            <form id="booking-form" onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Visit / Symptoms (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe any joint pain, back injury, or rehabilitation goals..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: Booking Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Booking Summary
            </h3>

            <div className="space-y-4 text-sm mb-6">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Service</span>
                <p className="font-medium text-slate-800 mt-0.5">{activeService?.title}</p>
                <p className="text-xs text-slate-500">{activeService?.duration} • {activeService?.price}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Date & Time</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Date'}
                </p>
                <p className="text-xs text-blue-600 font-medium">{selectedTime}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Location</span>
                <p className="font-medium text-slate-800 mt-0.5">Physiatry & Rehab Clinic</p>
                <p className="text-xs text-slate-500">Suite 402, Medical Center</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mb-6 flex justify-between items-center">
              <span className="font-semibold text-slate-900">Total Due</span>
              <span className="text-lg font-bold text-slate-900">{activeService?.price}</span>
            </div>

            <button
              form="booking-form"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  Confirm Appointment
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400 mt-3">
              No charge today. Payment due at time of visit.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}