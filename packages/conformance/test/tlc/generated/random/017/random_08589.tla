(*---
description: Evaluates a random record expression, seed 262, number 8589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([b13306 \in ({x \in 1..3 : x > 1} \ 2..1) |-> (b13306 + b13306)])[LET b13307 == ((1 :> 2))[2] IN (-1 + b13307)], b |-> ((\E b13308 \in UNION {Nat, {1, 2}} : (FALSE \/ TRUE)) /\ (Cardinality({x \in 1..3 : x > 1}) < (2 * -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 241 to line 14, col 241 of module random_08589 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 239.
    | Expression starting at line 14, column 239.
    | ExtendableExpr starting at line 14, column 238.
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | Fatal errors while parsing TLA+ spec in file random_08589
    | In module random_08589
    | Could not parse module random_08589 from file random_08589.tla
    | *** Errors: 1
    | In module random_08589
    | Could not parse module random_08589 from file random_08589.tla
    3002:1 Parsing or semantic analysis failed.
---*)
