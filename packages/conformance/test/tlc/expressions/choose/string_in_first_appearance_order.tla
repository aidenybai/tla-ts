(*---
description: "TLC orders strings by the order UniqueString first saw them, so the string that appears first in the source wins, whatever the alphabet says."
ref: "util/UniqueString.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE string_in_first_appearance_order ----
EXTENDS Integers
Test == (CHOOSE x \in {"zzq", "zza"} : TRUE) = "zzq"
====

(*--- recorded
all:
  exit: 0
---*)
