(*---
description: 'A bare string after ]_ is a parse error too.'
ref: tla2sany/parser/TLAplusParser.java#ClosedExpressionOrConstant
features: [liveness, subscript]
outcome: parse-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE string_subscript_needs_parens ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y
Spec == Init /\ [][Next]_"s"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ""s"" at line 15, column 26 and token "]_" 
    | Residual stack trace follows:
    | restricted form of expression starting at line 15, column 26.
    | Some [] Form starting at line 15, column 19.
    | ExtendableExpr starting at line 15, column 19.
    | ExtendableExpr starting at line 15, column 9.
    | Expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file string_subscript_needs_parens
    | In module string_subscript_needs_parens
    | Could not parse module string_subscript_needs_parens from file string_subscript_needs_parens.tla
    | *** Errors: 1
    | In module string_subscript_needs_parens
    | Could not parse module string_subscript_needs_parens from file string_subscript_needs_parens.tla
    3002:1 Parsing or semantic analysis failed.
---*)
