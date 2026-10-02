-- Un participant est soit un utilisateur, soit un invité, soit un bot : un seul des trois.
ALTER TABLE "Participant"
  ADD CONSTRAINT "Participant_identity_check"
  CHECK (num_nonnulls("userId", "guestName", "botLevel") = 1);
