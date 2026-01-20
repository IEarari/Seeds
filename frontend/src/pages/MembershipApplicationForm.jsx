import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AppShell from '../components/AppShell.jsx'
import { ensureDraftApplication, getApplicationById, saveDraft, submitApplication } from '../services/applications.js'
import { getVolunteeringSettings } from '../services/settings.js'
import { getMenuItems } from '../services/menus.js'
import { useAuth } from '../state/AuthContext.jsx'

// Country codes for WhatsApp with flags
const countryCodes = [
  { code: '+970', name: 'فلسطين', flag: '🇵🇸' },
  { code: '+972', name: 'الأراضي المحتلة', flag: '🇵🇸' },
  { code: '+962', name: 'الأردن', flag: '🇯🇴' },
  { code: '+20', name: 'مصر', flag: '🇪🇬' },
  { code: '+966', name: 'السعودية', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات', flag: '🇦🇪' },
  { code: '+968', name: 'عمان', flag: '🇴🇲' },
  { code: '+973', name: 'البحرين', flag: '🇧🇭' },
  { code: '+965', name: 'الكويت', flag: '🇰🇼' },
  { code: '+964', name: 'العراق', flag: '🇮🇶' },
  { code: '+963', name: 'سوريا', flag: '🇸🇾' },
  { code: '+961', name: 'لبنان', flag: '🇱🇧' },
  { code: '+213', name: 'الجزائر', flag: '🇩🇿' },
  { code: '+216', name: 'تونس', flag: '🇹🇳' },
  { code: '+212', name: 'المغرب', flag: '🇲🇦' },
  { code: '+218', name: 'ليبيا', flag: '🇱🇾' },
  { code: '+249', name: 'السودان', flag: '🇸🇩' },
  { code: '+967', name: 'اليمن', flag: '🇾🇪' },
]

// Common hobbies and skills suggestions
const commonHobbies = [
  'القراءة', 'الكتابة', 'الرسم', 'الموسيقى', 'الرياضة', 'السفر', 'الطبخ', 'التصوير',
  'البرمجة', 'الألعاب الإلكترونية', 'الحدائق', 'الحياكة', 'النجارة', 'السينما', 'المسرح'
]

const commonSkills = [
  'اللغة العربية', 'اللغة الإنجليزية', 'إدارة المشاريع', 'التواصل', 'القيادة', 'العمل الجماعي',
  'حل المشكلات', 'الإبداع', 'التخطيط', 'العرض والتقديم', 'البحث', 'التحليل', 'التصميم', 'التسويق'
]

const commonInstitutions = [
  'الهلال الأحمر', 'بلدية نابلس', 'وزارة الصحة'
]

function emptyProfile() {
  return {
    firstName: '',
    fatherName: '',
    grandFatherName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '',
    mobile: '',
    whatsappCountryCode: '+970',
    whatsappNumber: '',
    facebookId: null,
    instagramId: null,
    emergencyPhone: '',
    referees: [
      { name: '', phone: '' },
      { name: '', phone: '' },
    ],
    educationLevel: '',
    educationBranch: '',
    educationPlace: '',
    hobbies: [],
    skills: [],
    previousVolunteering: [],
  }
}

export default function MembershipApplicationForm() {
  const { authUser, userDoc } = useAuth()
  const navigate = useNavigate()

  const [applicationId, setApplicationId] = useState(null)
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(null)
  const [menus, setMenus] = useState({
    education_levels: [],
    education_branches: [],
    education_institutions: [],
  })

  const currentStatus = userDoc?.currentApplicationStatus

  const isEditable = useMemo(() => {
    return currentStatus === 'draft' || !currentStatus
  }, [currentStatus])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const s = await getVolunteeringSettings()
        if (!cancelled) setSettings(s)

        // Load menus for dropdowns
        console.log('Loading menus...')
        const [educationLevels, educationBranches, educationInstitutions] = await Promise.all([
          getMenuItems('education_levels'),
          getMenuItems('education_branches'),
          getMenuItems('education_institutions'),
        ])
        
        console.log('Menus loaded:', { educationLevels, educationBranches, educationInstitutions })
        
        if (!cancelled) {
          setMenus({
            education_levels: educationLevels.items || [],
            education_branches: educationBranches.items || [],
            education_institutions: educationInstitutions.items || [],
          })
        }

        if (!s.isApplicationOpen) {
          if (!cancelled) {
            setLoading(false)
            return
          }
        }

        const result = await ensureDraftApplication({ uid: authUser.uid })
        if (cancelled) return

        setApplicationId(result.applicationId)

        const app = await getApplicationById(result.applicationId)
        if (cancelled) return

        // Transform loaded profile for new format
        const loadedProfile = app?.profile || emptyProfile()
        
        // Handle backward compatibility for WhatsApp
        if (loadedProfile.whatsappE164 && !loadedProfile.whatsappCountryCode && !loadedProfile.whatsappNumber) {
          // Parse existing E164 format
          const whatsappE164 = loadedProfile.whatsappE164
          let countryCode = '+970' // default
          let number = whatsappE164
          
          // Try to extract country code
          for (const country of countryCodes) {
            if (whatsappE164.startsWith(country.code)) {
              countryCode = country.code
              number = whatsappE164.substring(country.code.length)
              break
            }
          }
          
          loadedProfile.whatsappCountryCode = countryCode
          loadedProfile.whatsappNumber = number
        }
        
        // Ensure hobbies and skills arrays exist
        if (!loadedProfile.hobbies) loadedProfile.hobbies = []
        if (!loadedProfile.skills) loadedProfile.skills = []
        if (!loadedProfile.previousVolunteering) loadedProfile.previousVolunteering = []
        
        // Handle backward compatibility for previous volunteering (if it was a string before)
        if (typeof loadedProfile.previousVolunteering === 'string') {
          loadedProfile.previousVolunteering = loadedProfile.previousVolunteering 
            ? [loadedProfile.previousVolunteering] 
            : []
        }
        
        setProfile(loadedProfile)
      } catch (e) {
        if (e.message === 'CLOSED') {
          setError('باب التطوع مغلق حالياً')
        } else {
          setError('تعذر تحميل الطلب')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [authUser.uid])

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }))

  const updateReferee = (idx, k, v) => {
    setProfile((p) => {
      const next = [...p.referees]
      next[idx] = { ...next[idx], [k]: v }
      return { ...p, referees: next }
    })
  }

  const addHobby = (hobby) => {
    if (hobby && !profile.hobbies.includes(hobby) && profile.hobbies.length < 10) {
      setProfile((p) => ({ ...p, hobbies: [...p.hobbies, hobby] }))
    }
  }

  const removeHobby = (index) => {
    setProfile((p) => ({ ...p, hobbies: p.hobbies.filter((_, i) => i !== index) }))
  }

  const addSkill = (skill) => {
    if (skill && !profile.skills.includes(skill) && profile.skills.length < 10) {
      setProfile((p) => ({ ...p, skills: [...p.skills, skill] }))
    }
  }

  const removeSkill = (index) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((_, i) => i !== index) }))
  }

  const addVolunteeringInstitution = (institution) => {
    if (institution && !profile.previousVolunteering.includes(institution) && profile.previousVolunteering.length < 3) {
      setProfile((p) => ({ ...p, previousVolunteering: [...p.previousVolunteering, institution] }))
    }
  }

  const removeVolunteeringInstitution = (index) => {
    setProfile((p) => ({ ...p, previousVolunteering: p.previousVolunteering.filter((_, i) => i !== index) }))
  }

  // Computed WhatsApp E164 format
  const whatsappE164 = `${profile.whatsappCountryCode}${profile.whatsappNumber}`

  return (
    <AppShell title="طلب العضوية">
      <div className="card">
        {!settings?.isApplicationOpen ? <div style={{ color: '#b45309' }}>باب التطوع مغلق حالياً</div> : null}
        {loading ? <div>جاري التحميل...</div> : null}
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}

        {settings?.isApplicationOpen && !loading ? (
          <>
            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>الاسم</label>
                <input disabled={!isEditable} value={profile.firstName} onChange={(e) => update('firstName', e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>اسم الأب</label>
                <input disabled={!isEditable} value={profile.fatherName} onChange={(e) => update('fatherName', e.target.value)} />
              </div>
            </div>

            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>اسم الجد</label>
                <input
                  disabled={!isEditable}
                  value={profile.grandFatherName}
                  onChange={(e) => update('grandFatherName', e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>اسم العائلة</label>
                <input disabled={!isEditable} value={profile.lastName} onChange={(e) => update('lastName', e.target.value)} />
              </div>
            </div>

            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>رقم الهوية</label>
                <input 
                  disabled={!isEditable} 
                  value={profile.nationalId} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 9) {
                      update('nationalId', value)
                    }
                  }}
                  placeholder="9 digits"
                  maxLength={9}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>تاريخ الميلاد</label>
                <DatePicker
                  disabled={!isEditable}
                  selected={profile.dateOfBirth ? new Date(profile.dateOfBirth) : null}
                  onChange={(date) => update('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                  className="date-picker-input"
                  locale="en-GB"
                  showYearDropdown
                  showMonthDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  maxDate={new Date()}
                  minDate={new Date(1950, 0, 1)}
                />
              </div>
            </div>

            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>رقم الجوال</label>
                <input 
                  disabled={!isEditable} 
                  value={profile.mobile} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 10) {
                      update('mobile', value)
                    }
                  }}
                  placeholder="10 digits max"
                  maxLength={10}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>واتساب</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    disabled={!isEditable}
                    value={profile.whatsappCountryCode}
                    onChange={(e) => update('whatsappCountryCode', e.target.value)}
                    style={{ width: 160 }}
                  >
                    {countryCodes.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  <input
                    disabled={!isEditable}
                    value={profile.whatsappNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 9) {
                        update('whatsappNumber', value)
                      }
                    }}
                    placeholder="599123456"
                    style={{ flex: 1 }}
                  />
                </div>
                {profile.whatsappNumber && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    الرقم الكامل: {whatsappE164}
                  </div>
                )}
              </div>
            </div>

            <div className="field">
              <label>هاتف للطوارئ</label>
              <input disabled={!isEditable} value={profile.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} />
            </div>

            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>المستوى التعليمي</label>
                <select
                  disabled={!isEditable}
                  value={profile.educationLevel}
                  onChange={(e) => update('educationLevel', e.target.value)}
                >
                  <option value="">اختر المستوى التعليمي</option>
                  {menus.education_levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              {profile.educationLevel === 'ثانوية عامة' && (
                <div style={{ flex: 1, minWidth: 240 }} className="field">
                  <label>الفرع</label>
                  <select
                    disabled={!isEditable}
                    value={profile.educationBranch || ''}
                    onChange={(e) => update('educationBranch', e.target.value)}
                  >
                    <option value="">اختر الفرع</option>
                    {menus.education_branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {['دبلوم', 'بكالوريوس', 'دراسات عليا'].includes(profile.educationLevel) && (
                <div style={{ flex: 1, minWidth: 240 }} className="field">
                  <label>المؤسسة التعليمية</label>
                  <select
                    disabled={!isEditable}
                    value={profile.educationPlace || ''}
                    onChange={(e) => update('educationPlace', e.target.value)}
                  >
                    <option value="">اختر المؤسسة</option>
                    {menus.education_institutions.map((institution) => (
                      <option key={institution} value={institution}>
                        {institution}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ fontWeight: 700, margin: '16px 0 8px' }}>المعرف الأول</div>
            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>الاسم</label>
                <input
                  disabled={!isEditable}
                  value={profile.referees[0]?.name || ''}
                  onChange={(e) => updateReferee(0, 'name', e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>الهاتف</label>
                <input
                  disabled={!isEditable}
                  value={profile.referees[0]?.phone || ''}
                  onChange={(e) => updateReferee(0, 'phone', e.target.value)}
                />
              </div>
            </div>

            <div style={{ fontWeight: 700, margin: '16px 0 8px' }}>المعرف الثاني</div>
            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>الاسم</label>
                <input
                  disabled={!isEditable}
                  value={profile.referees[1]?.name || ''}
                  onChange={(e) => updateReferee(1, 'name', e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>الهاتف</label>
                <input
                  disabled={!isEditable}
                  value={profile.referees[1]?.phone || ''}
                  onChange={(e) => updateReferee(1, 'phone', e.target.value)}
                />
              </div>
            </div>

            {/* Hobbies Section */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>الهوايات (اختياري - بحد أقصى 10)</div>
              <div className="field">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    disabled={!isEditable || profile.hobbies.length >= 10}
                    placeholder="أضف هواية..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addHobby(e.target.value.trim())
                        e.target.value = ''
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={!isEditable || profile.hobbies.length >= 10}
                    onClick={(e) => {
                      const input = e.target.previousElementSibling
                      if (input.value.trim()) {
                        addHobby(input.value.trim())
                        input.value = ''
                      }
                    }}
                  >
                    إضافة
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  اقتراحات: {commonHobbies.slice(0, 5).join(', ')}...
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.hobbies.map((hobby, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    >
                      {hobby}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => removeHobby(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 16,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>المهارات (اختياري - بحد أقصى 10)</div>
              <div className="field">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    disabled={!isEditable || profile.skills.length >= 10}
                    placeholder="أضف مهارة..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addSkill(e.target.value.trim())
                        e.target.value = ''
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={!isEditable || profile.skills.length >= 10}
                    onClick={(e) => {
                      const input = e.target.previousElementSibling
                      if (input.value.trim()) {
                        addSkill(input.value.trim())
                        input.value = ''
                      }
                    }}
                  >
                    إضافة
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  اقتراحات: {commonSkills.slice(0, 5).join(', ')}...
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.skills.map((skill, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    >
                      {skill}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 16,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Previous Volunteering Experience */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>أماكن تطوعت بها سابقاً (اختياري - بحد أقصى 3)</div>
              <div className="field">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    disabled={!isEditable || profile.previousVolunteering.length >= 3}
                    placeholder="أضف مؤسسة..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addVolunteeringInstitution(e.target.value.trim())
                        e.target.value = ''
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={!isEditable || profile.previousVolunteering.length >= 3}
                    onClick={(e) => {
                      const input = e.target.previousElementSibling
                      if (input.value.trim()) {
                        addVolunteeringInstitution(input.value.trim())
                        input.value = ''
                      }
                    }}
                  >
                    إضافة
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  اقتراحات: {commonInstitutions.slice(0, 5).join(', ')}...
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.previousVolunteering.map((institution, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    >
                      {institution}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => removeVolunteeringInstitution(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 16,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="actions" style={{ marginTop: 12 }}>
              <button
                className="btn secondary"
                type="button"
                disabled={!isEditable || busy || !applicationId}
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    // Transform profile for backend compatibility
                    const profileForBackend = {
                      ...profile,
                      whatsappE164: whatsappE164, // Convert to E164 format for backend
                      // Remove the split fields as they're not needed in backend
                      whatsappCountryCode: undefined,
                      whatsappNumber: undefined,
                    }
                    await saveDraft({ uid: authUser.uid, applicationId, profile: profileForBackend })
                  } catch (e) {
                    setError('تعذر حفظ المسودة')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                حفظ
              </button>

              <button
                className="btn"
                type="button"
                disabled={!isEditable || busy || !applicationId}
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    // Transform profile for backend compatibility
                    const profileForBackend = {
                      ...profile,
                      whatsappE164: whatsappE164, // Convert to E164 format for backend
                      // Remove the split fields as they're not needed in backend
                      whatsappCountryCode: undefined,
                      whatsappNumber: undefined,
                    }
                    await submitApplication({ uid: authUser.uid, applicationId, profile: profileForBackend })
                    navigate('/status')
                  } catch (e) {
                    setError(e.message || 'تعذر إرسال الطلب')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                إرسال الطلب
              </button>
            </div>

            <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              عند إرسال الطلب لن تتمكن من تعديل البيانات حتى يتم اتخاذ قرار.
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
