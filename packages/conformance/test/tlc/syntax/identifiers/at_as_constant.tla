(*---
description: "The @ check in a CONSTANT declaration reads the name from the declaration node, which holds no name, so the declaration passes and only the later use of @ is rejected."
ref: "tla2sany/semantic/Generator.java#processParameters"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE at_as_constant ----
CONSTANT @
ASSUME @ = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 8 of module at_as_constant
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
