(*---
description: "A nested module with a definition inside a recursive section stops SANY with an internal WrongInvocationException, instead of the error for a module in a recursive section."
ref: "tla2sany/semantic/Generator.java#checkIfInRecursiveSection"
features: [recursive, tlc-bug]
outcome: parse-error
correct:
  all:
    exit: 150
    transcript: |-
      | Semantic errors:
      | *** Errors: 1
      | line 18, col 1 to line 20, col 4 of module section_nested_module_with_definition_crash
      | A MODULE  may not appear within a recursive definition section.
      3002:1 Parsing or semantic analysis failed.
---*)
---- MODULE section_nested_module_with_definition_crash ----
RECURSIVE F
---- MODULE I ----
A == 1
====
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | util.WrongInvocationException: Defined more recursive operators than were declared in RECURSIVE statements.
    2171:1 Parsing or semantic analysis failed.
    2171:0 Parsing or semantic analysis failed.util.WrongInvocationException: Defined more recursive operators than were declared in RECURSIVE statements.
---*)
