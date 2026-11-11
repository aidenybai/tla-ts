(*---
description: Evaluates a random record expression, seed 262, number 5735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((1 - <<1, 2>>) + (<<1>> + 1)), b |-> (\E b8833 \in ({2, 1, 3} \ {1}) : (-1 \in 1..3))] EXCEPT !.a = Head(Append((SUBSET {1} \o <<>>), (-0)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 138 to line 14, col 143 of module random_05735 and \o.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 138.
    | ExtendableExpr starting at line 14, column 137.
    | Expression starting at line 14, column 137.
    | Optional Arguments starting at line 14, column 136.
    | Fatal errors while parsing TLA+ spec in file random_05735
    | In module random_05735
    | Could not parse module random_05735 from file random_05735.tla
    | *** Errors: 1
    | In module random_05735
    | Could not parse module random_05735 from file random_05735.tla
    3002:1 Parsing or semantic analysis failed.
---*)
