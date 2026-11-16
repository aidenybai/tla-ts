(*---
description: "A label needs a definition or step, so an unnamed ASSUME has no place for one."
ref: "tla2sany/semantic/Generator.java#inOpDefNode"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_on_module_assume_named_ok ----
ASSUME l:: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 8 to line 8, col 15 of module label_on_module_assume_named_ok
    | Label not in definition or proof step.
    3002:1 Parsing or semantic analysis failed.
---*)
