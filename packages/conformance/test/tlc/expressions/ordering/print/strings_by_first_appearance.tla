(*---
description: "Strings sort by intern token, which is the order they first appear in the source, not alphabetically."
ref: "util/UniqueString.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE strings_by_first_appearance ----
EXTENDS Integers, TLC
Test == PrintT({"zzb", "zza"})
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"zzb", "zza"}'
---*)
