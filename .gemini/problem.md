# î˜°U

## 2025-07-20 ã³-
### î˜Ïğ
ub4è„ PageStateSegmentedControl Äöû™b	®	¹ûàHàÕbû™!

### î˜
ÏÇãÑ°î˜@(

1. **ÄöMn**: `apps/client/src/features/user/components/page-state-pref.tsx:30-65`
2. **î˜9à**: `handleChange` ıp„ useCallback Vyï
   - SMVy`[user, setUser]` (,45L)
   - ”å„Vy`[setUser]` 

3. **î˜æÅ**:
   - SM„ `user` ùa(Vy-üôÏ! user ¶ØöıÍ°ú handleChange ıp
   - `user` ùa„vÖ^'ØüôÅ„Í°2ÓŒïı„Şaö
   - `updateUser` ıp(Œ¶ô°KôïıX(öî˜

4. **øsã**:
   ```typescript
   const handleChange = useCallback(
     async (value: string) => {
       const updatedUser = await updateUser({ pageEditMode: value });
       setValue(value);
       setUser(updatedUser);
     },
     [user, setUser], // ÙÌ„ user V/î˜@(
   );
   ```

### €/Æ‚
- û™¶1 `readOnly` ^'§6å^'ú(7(zô-„CP (`spaceAbility.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Page)`)
- Äöê( `!readOnly` ö2Ó`{!readOnly && <PageStateSegmentedControl size="xs" />}`
- PageEditMode š>šI`Read = "read"`, `Edit = "edit"`