/** sx สำหรับ TextField ใน dark-theme dialogs — ใช้ร่วมกันระหว่าง Add/Edit */
export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(0,212,200,0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#00D4C8' },
  },
  '& label.Mui-focused': { color: '#00D4C8' },
}
