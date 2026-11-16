(*---
description: "An earlier mention of a string in the module moves it ahead in TLCs order."
ref: "util/UniqueString.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE string_earlier_definition_flips_order ----
EXTENDS Integers
First == "zzs"
Test == (CHOOSE x \in {"zzr", "zzs"} : TRUE) = First
====

(*--- recorded
all:
  exit: 0
---*)
