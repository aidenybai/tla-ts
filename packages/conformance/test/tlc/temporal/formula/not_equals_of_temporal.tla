(*---
description: '<> binds looser than #, so an unparenthesized <>P # <>Q is a SANY precedence conflict.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE not_equals_of_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 1) # <>(x = 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops <> in block line 16, col 9 to line 16, col 10 of module not_equals_of_temporal and /=.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 11.
    | Expression starting at line 16, column 9.
    | Definition starting at line 16, column 1.
    | Module body starting at line 13, column 1.
    | Module definition starting at line 11, column 1.
    | Fatal errors while parsing TLA+ spec in file not_equals_of_temporal
    | In module not_equals_of_temporal
    | Could not parse module not_equals_of_temporal from file not_equals_of_temporal.tla
    | *** Errors: 1
    | In module not_equals_of_temporal
    | Could not parse module not_equals_of_temporal from file not_equals_of_temporal.tla
    3002:1 Parsing or semantic analysis failed.
---*)
