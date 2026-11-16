(*---
description: "An INSTANCE step of a missing module is rejected, though proofs are not checked."
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE proof_step_instance_missing ----
THEOREM TRUE
<1> INSTANCE NoSuchModule
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file proof_step_instance_missing
    | In module proof_step_instance_missing
    | Cannot find source file for module NoSuchModule imported in module proof_step_instance_missing.
    | *** Errors: 1
    | In module proof_step_instance_missing
    | Cannot find source file for module NoSuchModule imported in module proof_step_instance_missing.
    3002:1 Parsing or semantic analysis failed.
---*)
