(*---
description: 4312 fires for a leads-to whose left is an action through a definition.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_leads_named_action ----
VARIABLE v
Act == v' = v
A == Act ~> v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 13 of module temporal_leads_named_action
    | Action used where only temporal formula or state predicate allowed.
    3002:1 Parsing or semantic analysis failed.
---*)
