(*---
description: "\\ removes elements found in the right set."
ref: "tlc2/value/impl/SetEnumValue.java#diff"
flags: [expression]
outcome: success
---*)
---- MODULE diff_enum ----
EXTENDS Integers
Test == ({1, 2, 3} \ {2}) = {1, 3}
====

(*--- recorded
all:
  exit: 0
---*)
