(*---
description: "Sets of records with different field names are unequal."
ref: "tlc2/value/impl/SetOfRcdsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE different_field_names_unequal ----
EXTENDS Integers
Test == [a : {1}] # [b : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
