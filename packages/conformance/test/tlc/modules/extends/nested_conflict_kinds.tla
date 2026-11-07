(*---
description: Nested siblings conflict the same way when kinds differ.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
outcome: parse-error
---*)
---- MODULE nested_conflict_kinds ----
---- MODULE A ----
X == 1
====
---- MODULE B ----
CONSTANT X
====
---- MODULE C ----
EXTENDS A, B
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 10 to line 12, col 10 of module nested_conflict_kinds
    | The declaration of 'X' conflicts with 
    | its definition at line 9, col 1 to line 9, col 6 of module nested_conflict_kinds.
    3002:1 Parsing or semantic analysis failed.
---*)
