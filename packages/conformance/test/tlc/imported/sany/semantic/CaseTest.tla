(*---
description: "Ported from SANY's semantic corpus: CaseTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/CaseTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
----------------------------- MODULE CaseTest -------------------------------
EXTENDS Semantics
CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

(* ID: ConstantCase *)
ConstantCase == 
  CASE RefersTo(c, "c") -> IsLevel(c, ConstantLevel)
  [] 4 -> 5

THEOREM RefersTo(ConstantCase, "ConstantCase")
THEOREM IsLevel(ConstantCase, ConstantLevel)

(* ID: VariableCaseLHS *)
VariableCaseLHS ==
  CASE RefersTo(v, "v") -> 1

THEOREM RefersTo(VariableCaseLHS, "VariableCaseLHS")
THEOREM IsLevel(VariableCaseLHS, VariableLevel)

(* ID: VariableCaseRHS *)
VariableCaseRHS ==
  CASE 1 -> IsLevel(v, VariableLevel)

THEOREM RefersTo(VariableCaseRHS, "VariableCaseRHS")
THEOREM IsLevel(VariableCaseRHS, VariableLevel)

(* ID: VariableCaseOther *)
VariableCaseOther ==
  CASE 1 -> 2
  [] OTHER -> RefersTo(v, "v")

THEOREM RefersTo(VariableCaseOther, "VariableCaseOther")
THEOREM IsLevel(VariableCaseRHS, VariableLevel)

(* ID: action *)
action == v'

(* ID: ActionCaseLHS *)
ActionCaseLHS ==
  CASE RefersTo(action, "action") -> 1

THEOREM RefersTo(ActionCaseLHS, "ActionCaseLHS")
THEOREM IsLevel(ActionCaseLHS, ActionLevel)

(* ID: ActionCaseRHS *)
ActionCaseRHS ==
  CASE 1 -> IsLevel(action, ActionLevel)

THEOREM RefersTo(ActionCaseRHS, "ActionCaseRHS")
THEOREM IsLevel(ActionCaseRHS, ActionLevel)

(* ID: ActionCaseOther *)
ActionCaseOther ==
  CASE 1 -> 2
  [] OTHER -> RefersTo(action, "action")

THEOREM RefersTo(ActionCaseOther, "ActionCaseOther")
THEOREM IsLevel(ActionCaseRHS, ActionLevel)

(* ID: temporal *)
temporal == []c

(* ID: TemporalCaseLHS *)
TemporalCaseLHS ==
  CASE RefersTo(temporal, "temporal") -> 1

THEOREM RefersTo(TemporalCaseLHS, "TemporalCaseLHS")
THEOREM IsLevel(TemporalCaseLHS, TemporalLevel)

(* ID: TemporalCaseRHS *)
TemporalCaseRHS ==
  CASE 1 -> IsLevel(temporal, TemporalLevel)

THEOREM RefersTo(TemporalCaseRHS, "TemporalCaseRHS")
THEOREM IsLevel(TemporalCaseRHS, TemporalLevel)

(* ID: TemporalCaseOther *)
TemporalCaseOther ==
  CASE 1 -> 2
  [] OTHER -> RefersTo(temporal, "temporal")

THEOREM RefersTo(TemporalCaseOther, "TemporalCaseOther")
THEOREM IsLevel(TemporalCaseRHS, TemporalLevel)

(* ID: MixedLevelCase *)
MixedLevelCase ==
  CASE IsLevel(c, ConstantLevel) -> IsLevel(v, VariableLevel)
  [] IsLevel(action, ActionLevel) -> IsLevel(temporal, TemporalLevel)

THEOREM RefersTo(MixedLevelCase, "MixedLevelCase")
THEOREM IsLevel(MixedLevelCase, TemporalLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file CaseTest
    | In module CaseTest
    | Cannot find source file for module Semantics imported in module CaseTest.
    | *** Errors: 1
    | In module CaseTest
    | Cannot find source file for module Semantics imported in module CaseTest.
    3002:1 Parsing or semantic analysis failed.
---*)
