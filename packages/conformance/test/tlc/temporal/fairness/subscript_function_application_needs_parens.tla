(*---
description: 'WF_pc[p](..) is an ill-structured fairness expression: the subscript grammar stops short of function application.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE subscript_function_application_needs_parens ----
EXTENDS Naturals
VARIABLE pc
S == {1, 2}
Step(p) == pc[p] = 0 /\ pc' = [pc EXCEPT ![p] = 1]
Next == \E p \in S : Step(p)
Init == pc = [p \in S |-> 0]
Prop == <>(\A p \in S : pc[p] = 1)

Spec == Init /\ [][Next]_pc /\ \A p \in S : WF_pc[p](Step(p))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Ill-structured fairness expression at line 20, column 45
    | Residual stack trace follows:
    | ExtendableExpr starting at line 20, column 45.
    | Expression starting at line 20, column 45.
    | Quantified form starting at line 20, column 32.
    | ExtendableExpr starting at line 20, column 19.
    | ExtendableExpr starting at line 20, column 9.
    | Fatal errors while parsing TLA+ spec in file subscript_function_application_needs_parens
    | In module subscript_function_application_needs_parens
    | Could not parse module subscript_function_application_needs_parens from file subscript_function_application_needs_parens.tla
    | *** Errors: 1
    | In module subscript_function_application_needs_parens
    | Could not parse module subscript_function_application_needs_parens from file subscript_function_application_needs_parens.tla
    3002:1 Parsing or semantic analysis failed.
---*)
