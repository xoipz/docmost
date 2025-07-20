# U

## 2025-07-20 �-
### ���
ub4� PageStateSegmentedControl ����b	�	���H��b��!

### ��
����Ѱ�@(

1. **��Mn**: `apps/client/src/features/user/components/page-state-pref.tsx:30-65`
2. **�9�**: `handleChange` �p� useCallback �Vy�
   - SM�Vy`[user, setUser]` (,45L)
   - �儝Vy`[setUser]` 

3. **���**:
   - SM� `user` �a(�Vy-���! user ����Ͱ� handleChange �p
   - `user` �a�v�^'���Ł�Ͱ2ӌ����a�
   - `updateUser` �p(����K���X(���

4. **�s�**:
   ```typescript
   const handleChange = useCallback(
     async (value: string) => {
       const updatedUser = await updateUser({ pageEditMode: value });
       setValue(value);
       setUser(updatedUser);
     },
     [user, setUser], // �̄ user �V/�@(
   );
   ```

### �/Ƃ
- ���1 `readOnly` ^'�6�^'��(7(z�-�CP (`spaceAbility.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Page)`)
- ���( `!readOnly` �2�`{!readOnly && <PageStateSegmentedControl size="xs" />}`
- PageEditMode �>�I`Read = "read"`, `Edit = "edit"`