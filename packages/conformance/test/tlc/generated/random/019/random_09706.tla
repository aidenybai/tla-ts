(*---
description: Evaluates a random record expression, seed 262, number 9706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE b15064 \in {2, 1, 3} : FALSE) * ([a |-> 1, b |-> TRUE]).a), b |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] = (CHOOSE f \in [{1, 2} -> 2..1] : TRUE))] EXCEPT !.a = Len(<<(2147483647 * -1), (CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE)>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 213 to line 14, col 213 of module random_09706 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | ExtendableExpr starting at line 14, column 201.
    | Expression starting at line 14, column 201.
    | Some << -- >> or >>_ Form starting at line 14, column 199.
    | Fatal errors while parsing TLA+ spec in file random_09706
    | In module random_09706
    | Could not parse module random_09706 from file random_09706.tla
    | *** Errors: 1
    | In module random_09706
    | Could not parse module random_09706 from file random_09706.tla
    3002:1 Parsing or semantic analysis failed.
---*)
