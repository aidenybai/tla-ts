(*---
description: "A nested module's name need not match any file."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [file_names]
flags: [expression]
outcome: success
---*)
---- MODULE root_nested_name_matches_nothing ----
---- MODULE Whatever_Name ----
A == 1
====
INSTANCE Whatever_Name
Test == A = 1
====

(*--- recorded
all:
  exit: 0
---*)
