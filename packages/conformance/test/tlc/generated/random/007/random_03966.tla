(*---
description: Evaluates a random set expression, seed 262, number 3966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SubSeq((<<1, 2>> \o <<3, 1, 2>>), (3 * -1), ([a |-> 1, b |-> TRUE]).a), ((0 * -1) % ([a |-> 1]).a)) EXCEPT ![1] = (\A b6241 \in DOMAIN ([x \in Nat |-> x + 1] @@ (1 :> 2)) : ((\A b6242 \in 2..1 : TRUE) => (b6241 = b6241)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 61 to line 14, col 61 of module random_03966 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 59.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | Optional Arguments starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_03966
    | In module random_03966
    | Could not parse module random_03966 from file random_03966.tla
    | *** Errors: 1
    | In module random_03966
    | Could not parse module random_03966 from file random_03966.tla
    3002:1 Parsing or semantic analysis failed.
---*)
