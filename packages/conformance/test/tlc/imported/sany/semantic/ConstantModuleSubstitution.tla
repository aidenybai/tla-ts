(*---
description: "Ported from SANY's semantic corpus: ConstantModuleSubstitution.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/ConstantModuleSubstitution.tla
features:
  - sany-semantic
outcome: parse-error
---*)
When a module is entirely constant (only declares constants, all definitions
are constant-level, only extends constant modules) then any expression level
can be substituted for its constants when importing using INSTANCE.
-------------------- MODULE ConstantModuleSubstitution ----------------------
EXTENDS Semantics
VARIABLE (* ID: v *) v
------------------------------- MODULE Inner ------------------------------
CONSTANT (* ID: c *) c
(* ID: op *) op == c
===========================================================================
constantLevelImport == INSTANCE Inner WITH c <- 0
THEOREM IsLevel(RefersTo(constantLevelImport!op, "op"), ConstantLevel)
variableLevelImport == INSTANCE Inner WITH c <- RefersTo(v, "v")
THEOREM IsLevel(RefersTo(variableLevelImport!op, "op"), VariableLevel)
actionLevelImport == INSTANCE Inner WITH c <- RefersTo(v, "v")'
THEOREM IsLevel(RefersTo(actionLevelImport!op, "op"), ActionLevel)
temporalLevelImport == INSTANCE Inner WITH c <- []RefersTo(v, "v")
THEOREM IsLevel(RefersTo(temporalLevelImport!op, "op"), TemporalLevel)
=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file ConstantModuleSubstitution
    | In module ConstantModuleSubstitution
    | Cannot find source file for module Semantics imported in module ConstantModuleSubstitution.
    | *** Errors: 1
    | In module ConstantModuleSubstitution
    | Cannot find source file for module Semantics imported in module ConstantModuleSubstitution.
    3002:1 Parsing or semantic analysis failed.
---*)
