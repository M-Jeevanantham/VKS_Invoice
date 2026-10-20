import React, { useState } from 'react';
import { BusinessSettings } from '../../types';
import {
  Settings,
  Building,
  CreditCard,
  FileSpreadsheet,
  Printer,
  Upload,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface BusinessSettingsViewProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  onUploadMedia: (file: File, folder: 'logos' | 'signatures' | 'murugan' | 'qr') => Promise<string>;
  onChangePassword?: (email: string, currentPass: string, newPass: string) => Promise<boolean>;
  currentUser?: { email: string; full_name: string; role: string };
}

export const BusinessSettingsView: React.FC<BusinessSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onUploadMedia,
  onChangePassword,
  currentUser = { email: 'vks@admin.in', full_name: 'Salem Admin', role: 'ADMIN' },
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'numbering' | 'terms' | 'print' | 'security'>(
    'profile'
  );

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState(settings.business_name);
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');
  const [muruganImageUrl, setMuruganImageUrl] = useState(settings.murugan_image_url || '');
  const [signatureUrl, setSignatureUrl] = useState(settings.signature_url || '');
  const [upiQrUrl, setUpiQrUrl] = useState(settings.upi_qr_url || '');

  const [addressLine1, setAddressLine1] = useState(settings.address_line1);
  const [addressLine2, setAddressLine2] = useState(settings.address_line2 || '');
  const [city, setCity] = useState(settings.city);
  const [state, setState] = useState(settings.state);
  const [stateCode, setStateCode] = useState(settings.state_code);
  const [postalCode, setPostalCode] = useState(settings.postal_code);
  const [phonePrimary, setPhonePrimary] = useState(settings.phone_primary);
  const [phoneSecondary, setPhoneSecondary] = useState(settings.phone_secondary || '');
  const [email, setEmail] = useState(settings.email);
  const [gstin, setGstin] = useState(settings.gstin);
  const [pan, setPan] = useState(settings.pan || '');
  const [defaultPlaceOfSupply, setDefaultPlaceOfSupply] = useState(settings.default_place_of_supply);

  // Bank
  const [bankName, setBankName] = useState(settings.bank_name);
  const [bankBranch, setBankBranch] = useState(settings.bank_branch);
  const [accountHolderName, setAccountHolderName] = useState(settings.account_holder_name);
  const [accountNumber, setAccountNumber] = useState(settings.account_number);
  const [ifscCode, setIfscCode] = useState(settings.ifsc_code);
  const [accountType, setAccountType] = useState(settings.account_type);

  // Numbering
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix);
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState(settings.invoice_number_format);
  const [nextSequenceNumber, setNextSequenceNumber] = useState(settings.next_sequence_number);
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(
    settings.default_payment_terms_days
  );

  // Terms (Section 18 exact 4 terms)
  const [term1, setTerm1] = useState(settings.term_1);
  const [term2, setTerm2] = useState(settings.term_2);
  const [term3, setTerm3] = useState(settings.term_3);
  const [term4, setTerm4] = useState(settings.term_4);

  // Print settings
  const [showLogoOnPrint, setShowLogoOnPrint] = useState(settings.show_logo_on_print);
  const [showMuruganOnPrint, setShowMuruganOnPrint] = useState(settings.show_murugan_on_print);
  const [showSignatureOnPrint, setShowSignatureOnPrint] = useState(settings.show_signature_on_print);
  const [enableEinvoiceSection, setEnableEinvoiceSection] = useState(settings.enable_einvoice_section);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle media uploads
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: 'logos' | 'signatures' | 'murugan' | 'qr',
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5 MB.');
      return;
    }

    try {
      setErrorMsg('');
      const uploadedUrl = await onUploadMedia(file, folder);
      setter(uploadedUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload image.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      await onSaveSettings({
        business_name: businessName.trim(),
        tagline: tagline.trim(),
        logo_url: logoUrl,
        murugan_image_url: muruganImageUrl,
        signature_url: signatureUrl,
        upi_qr_url: upiQrUrl,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        state_code: stateCode.trim(),
        postal_code: postalCode.trim(),
        phone_primary: phonePrimary.trim(),
        phone_secondary: phoneSecondary.trim() || undefined,
        email: email.trim(),
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase() || undefined,
        default_place_of_supply: defaultPlaceOfSupply.trim(),
        bank_name: bankName.trim(),
        bank_branch: bankBranch.trim(),
        account_holder_name: accountHolderName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        account_type: accountType.trim(),
        invoice_prefix: invoicePrefix.trim(),
        invoice_number_format: invoiceNumberFormat.trim(),
        next_sequence_number: Number(nextSequenceNumber) || 1,
        default_payment_terms_days: Number(defaultPaymentTermsDays) || 30,
        term_1: term1,
        term_2: term2,
        term_3: term3,
        term_4: term4,
        show_logo_on_print: showLogoOnPrint,
        show_murugan_on_print: showMuruganOnPrint,
        show_signature_on_print: showSignatureOnPrint,
        enable_einvoice_section: enableEinvoiceSection,
      });

      setSuccessMsg('Settings saved successfully and applied to future invoices.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update business settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-2 shadow-subtle flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-[#702C3B] text-white shadow-xs'
              : 'text-[#6C5D64] hover:bg-[#FAF6F5] hover:text-[#30252A]'
          }`}
        >
          <Building size={14} />
          <span>Business Profile &amp; Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('banking')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all ${
            activeTab === 'banking'
              ? 'bg-[#702C3B] text-white shadow-xs'
              : 'text-[#6C5D64] hover:bg-[#FAF6F5] hover:text-[#30252A]'
          }`}
        >
          <CreditCard size={14} />
          <span>Bank Remittance Details</span>
        </button>

        <button
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all ${
            activeTab === 'numbering'
              ? 'bg-[#702C3B] text-white shadow-xs'
              : 'text-[#6C5D64] hover:bg-[#FAF6F5] hover:text-[#30252A]'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>Invoice Numbering &amp; Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all ${
            activeTab === 'terms'
              ? 'bg-[#702C3B] text-white shadow-xs'
              : 'text-[#6C5D64] hover:bg-[#FAF6F5] hover:text-[#30252A]'
          }`}
        >
          <Settings size={14} />
          <span>Terms &amp; Conditions</span>
        </button>

        <button
          onClick={() => setActiveTab('print')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all ${
            activeTab === 'print'
              ? 'bg-[#702C3B] text-white shadow-xs'
              : 'text-[#6C5D64] hover:bg-[#FAF6F5] hover:text-[#30252A]'
          }`}
        >
          <Printer size={14} />
          <span>Print &amp; E-Invoice Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-[#702C3B] text-white shadow-xs'
              : 'text-[#6C5D64] hover:bg-[#FAF6F5] hover:text-[#30252A]'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Admin Security &amp; Password</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#EBF6F1] border border-[#C1E6D6] text-[#1E7B54] rounded text-xs flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Business Profile & Visual Assets */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#30252A] font-serif border-b border-[#E8DFDC] pb-2">
                Business Information &amp; Address
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] font-bold text-sm focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Tagline / Subheading
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Manufacturers of High Quality Viscose & Cotton Fabrics"
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      Primary Contact Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={phonePrimary}
                      onChange={(e) => setPhonePrimary(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      Secondary Contact Phone
                    </label>
                    <input
                      type="text"
                      value={phoneSecondary}
                      onChange={(e) => setPhoneSecondary(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      Business Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      Default Place of Supply
                    </label>
                    <input
                      type="text"
                      value={defaultPlaceOfSupply}
                      onChange={(e) => setDefaultPlaceOfSupply(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      GSTIN *
                    </label>
                    <input
                      type="text"
                      required
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] font-mono uppercase focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      PAN
                    </label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] font-mono uppercase focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">State Code</label>
                    <input
                      type="text"
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Brand Assets (Logo, Lord Murugan, Signature) */}
            <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#30252A] font-serif border-b border-[#E8DFDC] pb-2">
                Brand &amp; Devotional Assets
              </h3>

              {/* VKS Logo */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-[#30252A] block">1. Business Logo</span>
                <div className="p-3 bg-[#FAF6F5] rounded border border-[#E8DFDC] flex items-center justify-between gap-3">
                  <div className="w-20 h-14 bg-white rounded border border-[#E8DFDC] p-1 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon size={20} className="text-[#6C5D64]" />
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1 bg-white border border-[#E8DFDC] hover:bg-[#E8DFDC] rounded text-xs font-medium text-[#702C3B]">
                    <span>Replace Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'logos', setLogoUrl)}
                    />
                  </label>
                </div>
              </div>

              {/* Lord Murugan Image */}
              <div className="space-y-2 text-xs pt-2 border-t border-[#E8DFDC]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#30252A]">2. Lord Murugan Image</span>
                  {muruganImageUrl && (
                    <button
                      type="button"
                      onClick={() => setMuruganImageUrl('')}
                      className="text-[10px] text-[#B82A3A] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="p-3 bg-[#FAF6F5] rounded border border-[#E8DFDC] flex items-center justify-between gap-3">
                  <div className="w-20 h-14 bg-white rounded border border-[#E8DFDC] p-1 flex items-center justify-center overflow-hidden">
                    {muruganImageUrl ? (
                      <img src={muruganImageUrl} alt="Murugan" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-center text-[#6C5D64] italic">
                        || ஸ்ரீ முருகன் ||
                      </span>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1 bg-white border border-[#E8DFDC] hover:bg-[#E8DFDC] rounded text-xs font-medium text-[#702C3B]">
                    <span>Upload Deity</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'murugan', setMuruganImageUrl)}
                    />
                  </label>
                </div>
              </div>

              {/* Optional Authorized Signature (Section 20) */}
              <div className="space-y-2 text-xs pt-2 border-t border-[#E8DFDC]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#30252A]">3. Authorized Signature (Optional)</span>
                  {signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setSignatureUrl('')}
                      className="text-[10px] text-[#B82A3A] hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Remove Signature</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-[#FAF6F5] rounded border border-[#E8DFDC] flex items-center justify-between gap-3">
                  <div className="w-28 h-14 bg-white rounded border border-[#E8DFDC] p-1 flex items-center justify-center overflow-hidden">
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain filter grayscale" />
                    ) : (
                      <span className="text-[9px] text-center text-[#6C5D64] italic">
                        (Blank: Manual signing by hand)
                      </span>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1 bg-white border border-[#E8DFDC] hover:bg-[#E8DFDC] rounded text-xs font-medium text-[#702C3B]">
                    <span>{signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'signatures', setSignatureUrl)}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-[#6C5D64]">
                  Per prompt rules: If left blank, the printed invoice displays an empty area for manual physical pen signature.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Banking Details */}
        {activeTab === 'banking' && (
          <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle max-w-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#30252A] font-serif border-b border-[#E8DFDC] pb-2">
              Bank Details for Electronic Remittance (NEFT / RTGS / IMPS)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-semibold focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Account Beneficiary Name *
                </label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-semibold focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono uppercase font-bold focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                >
                  <option value="Current Account">Current Account</option>
                  <option value="Cash Credit Account">Cash Credit (CC) Account</option>
                  <option value="Savings Account">Savings Account</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Invoice Numbering & Sequence */}
        {activeTab === 'numbering' && (
          <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle max-w-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#30252A] font-serif border-b border-[#E8DFDC] pb-2">
              Invoice Numbering Sequence &amp; Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono uppercase focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Numbering Pattern
                  </label>
                  <input
                    type="text"
                    value={invoiceNumberFormat}
                    onChange={(e) => setInvoiceNumberFormat(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono focus:outline-none focus:border-[#702C3B]"
                  />
                  <span className="text-[10px] text-[#6C5D64] mt-0.5 block">
                    Supported tags: {'{PREFIX}'}, {'{YEAR}'}, {'{SEQ}'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Next Sequence Counter
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nextSequenceNumber}
                    onChange={(e) => setNextSequenceNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono tabular-nums focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Default Credit Period (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={defaultPaymentTermsDays}
                    onChange={(e) => setDefaultPaymentTermsDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono tabular-nums focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF6F5] rounded border border-[#E8DFDC] space-y-1">
                <span className="font-semibold text-[#702C3B] block">Next Invoice Sample:</span>
                <span className="font-mono font-bold text-sm text-[#30252A]">
                  {invoiceNumberFormat
                    .replace('{PREFIX}', invoicePrefix)
                    .replace('{YEAR}', new Date().getFullYear().toString())
                    .replace('{SEQ}', String(nextSequenceNumber).padStart(3, '0'))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Exact Terms and Conditions (Section 18) */}
        {activeTab === 'terms' && (
          <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle max-w-3xl space-y-4">
            <div className="border-b border-[#E8DFDC] pb-2">
              <h3 className="text-sm font-bold text-[#30252A] font-serif">
                Commercial Terms &amp; Conditions (Exact 4 Rules)
              </h3>
              <p className="text-[11px] text-[#6C5D64]">
                Per Section 18: Exactly these 4 clauses must be preserved verbatim.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">Term 1</label>
                <input
                  type="text"
                  value={term1}
                  onChange={(e) => setTerm1(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs text-[#30252A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">Term 2</label>
                <input
                  type="text"
                  value={term2}
                  onChange={(e) => setTerm2(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs text-[#30252A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">Term 3</label>
                <input
                  type="text"
                  value={term3}
                  onChange={(e) => setTerm3(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs text-[#30252A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">Term 4</label>
                <input
                  type="text"
                  value={term4}
                  onChange={(e) => setTerm4(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs text-[#30252A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Print & Layout Settings */}
        {activeTab === 'print' && (
          <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle max-w-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#30252A] font-serif border-b border-[#E8DFDC] pb-2">
              Grayscale A4 Print Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={showLogoOnPrint}
                  onChange={(e) => setShowLogoOnPrint(e.target.checked)}
                  className="w-4 h-4 text-[#702C3B] rounded border-[#E8DFDC]"
                />
                <label htmlFor="showLogo" className="font-medium text-[#30252A]">
                  Display VKS Logo on Grayscale A4 Print
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showMurugan"
                  checked={showMuruganOnPrint}
                  onChange={(e) => setShowMuruganOnPrint(e.target.checked)}
                  className="w-4 h-4 text-[#702C3B] rounded border-[#E8DFDC]"
                />
                <label htmlFor="showMurugan" className="font-medium text-[#30252A]">
                  Display Lord Murugan devotional banner on header
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showSig"
                  checked={showSignatureOnPrint}
                  onChange={(e) => setShowSignatureOnPrint(e.target.checked)}
                  className="w-4 h-4 text-[#702C3B] rounded border-[#E8DFDC]"
                />
                <label htmlFor="showSig" className="font-medium text-[#30252A]">
                  Include uploaded signature image (leave unchecked for physical manual pen signing)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showEinvoice"
                  checked={enableEinvoiceSection}
                  onChange={(e) => setEnableEinvoiceSection(e.target.checked)}
                  className="w-4 h-4 text-[#702C3B] rounded border-[#E8DFDC]"
                />
                <label htmlFor="showEinvoice" className="font-medium text-[#30252A]">
                  Enable optional government E-Invoice IRN &amp; Ack section
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Account Details */}
            <div className="bg-white border border-[#E8DFDC] rounded-lg p-6 shadow-subtle space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E8DFDC]">
                <div className="w-10 h-10 rounded-full bg-[#702C3B] text-white font-bold text-sm flex items-center justify-center border-2 border-[#D4AE77]">
                  VK
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#30252A] font-serif">
                    {currentUser.full_name || 'Salem Admin'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#6C5D64] font-mono">{currentUser.email || 'vks@admin.in'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#EBF6F1] text-[#1E7B54] font-semibold border border-[#C1E6D6]">
                      {currentUser.role || 'ADMIN'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#FAF6F5] rounded-lg border border-[#E8DFDC]">
                  <span className="text-[10px] font-semibold text-[#6C5D64] uppercase block mb-1">
                    Authorization Type
                  </span>
                  <span className="font-semibold text-[#30252A]">Session-Based Token Authentication</span>
                  <p className="text-[11px] text-[#6C5D64] mt-1">
                    Secured by Supabase PostgreSQL <code className="text-[#702C3B] font-mono">public.auth_users</code> with offline recovery fallback.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF6F5] rounded-lg border border-[#E8DFDC]">
                  <span className="text-[10px] font-semibold text-[#6C5D64] uppercase block mb-1">
                    System Permissions
                  </span>
                  <span className="font-semibold text-[#1E7B54] flex items-center gap-1">
                    <ShieldCheck size={14} /> Full Administrative Access
                  </span>
                  <p className="text-[11px] text-[#6C5D64] mt-1">
                    Invoice creation, finalization, sequential locking, PDF exports, and customer ledger management.
                  </p>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-white border border-[#E8DFDC] rounded-lg p-6 shadow-subtle space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFDC]">
                <KeyRound size={16} className="text-[#702C3B]" />
                <h3 className="font-bold text-sm text-[#30252A] font-serif">
                  Change Administrative Password
                </h3>
              </div>

              {pwSuccess && (
                <div className="p-3 bg-[#EBF6F1] border border-[#C1E6D6] text-[#1E7B54] rounded text-xs flex items-center gap-2">
                  <CheckCircle size={15} />
                  <span>{pwSuccess}</span>
                </div>
              )}

              {pwError && (
                <div className="p-3 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{pwError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      className="w-full px-3 py-2 pr-8 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6C5D64] hover:text-[#30252A]"
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Enter new password (min 4 chars)"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full px-3 py-2 pr-8 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6C5D64] hover:text-[#30252A]"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-[#6C5D64]">
                  Updated password synchronizes with live Supabase database immediately.
                </span>
                <button
                  type="button"
                  disabled={isChangingPw}
                  onClick={async () => {
                    setPwError('');
                    setPwSuccess('');
                    if (!currentPass.trim()) {
                      setPwError('Please enter your current password.');
                      return;
                    }
                    if (!newPass.trim() || newPass.length < 4) {
                      setPwError('New password must be at least 4 characters long.');
                      return;
                    }
                    if (newPass !== confirmPass) {
                      setPwError('New password and confirmation password do not match.');
                      return;
                    }

                    try {
                      setIsChangingPw(true);
                      if (onChangePassword) {
                        await onChangePassword(currentUser.email, currentPass, newPass);
                      }
                      setPwSuccess('Password successfully changed and saved to Supabase database!');
                      setCurrentPass('');
                      setNewPass('');
                      setConfirmPass('');
                    } catch (err: any) {
                      setPwError(err.message || 'Failed to change password.');
                    } finally {
                      setIsChangingPw(false);
                    }
                  }}
                  className="px-4 py-2 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isChangingPw ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="flex justify-end pt-4 border-t border-[#E8DFDC]">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50 focus:ring-2 focus:ring-[#D4AE77]"
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
