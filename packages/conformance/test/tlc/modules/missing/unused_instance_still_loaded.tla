(*---
description: "A module that nothing uses is still loaded, even from an unused operator's LET."
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE unused_instance_still_loaded ----
Unused(x) == LET M == INSTANCE NoSuchModule IN x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file unused_instance_still_loaded
    | In module unused_instance_still_loaded
    | Cannot find source file for module NoSuchModule imported in module unused_instance_still_loaded.
    | *** Errors: 1
    | In module unused_instance_still_loaded
    | Cannot find source file for module NoSuchModule imported in module unused_instance_still_loaded.
    3002:1 Parsing or semantic analysis failed.
---*)
