(*---
description: "\\cap with a Reducible left filters that side."
ref: "tlc2/value/impl/SetEnumValue.java#cap"
flags: [expression]
outcome: success
---*)
---- MODULE cap_filters_left_reducible ----
EXTENDS Integers
Test == ({1, 2} \cap {2, 3}) = {2}
====

(*--- recorded
all:
  exit: 0
---*)
