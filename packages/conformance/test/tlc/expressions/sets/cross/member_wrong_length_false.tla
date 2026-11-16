(*---
description: "A tuple of another length is not a member, with no error."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_wrong_length_false ----
EXTENDS Integers
Test == <<1>> \notin {1} \X {2} /\ <<1, 2, 3>> \notin {1} \X {2}
====

(*--- recorded
all:
  exit: 0
---*)
