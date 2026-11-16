(*---
description: Two steps at one level with one name only draw a warning.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_duplicate_name ----
THEOREM FALSE
<1>1. TRUE
<1>1. TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 11, col 1 to line 11, col 5 of module step_duplicate_name
    | Multiple declarations or definitions for symbol <1>1.  
    | This duplicates the one at line 10, col 1 to line 10, col 5 of module step_duplicate_name.
---*)
