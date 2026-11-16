(*---
description: "With two declarations, each needs a value: the message names the missing one."
ref: "tla2sany/semantic/SubstInNode.java#matchAll"
features: [instance]
outcome: parse-error
---*)
---- MODULE implicit_not_found_second ----
---- MODULE I ----
CONSTANTS a, b
====
a == 1
M == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 15 of module implicit_not_found_second
    | Substitution missing for symbol b declared at line 9, col 14 to line 9, col 14 of module implicit_not_found_second 
    | and instantiated in module implicit_not_found_second.
    3002:1 Parsing or semantic analysis failed.
---*)
