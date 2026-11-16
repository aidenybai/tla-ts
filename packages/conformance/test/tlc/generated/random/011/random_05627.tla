(*---
description: Evaluates a random bool expression, seed 262, number 5627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 .. -1) \cup SelectSeq(<<1>>, LAMBDA e : e > 0)) \subseteq {b8697 \in ({} \cap {x \in 1..3 : x > 1}) : (\A b8698 \in SUBSET {1} : TRUE)}) /\ (CASE (TRUE \/ FALSE) -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> (2 + -1) \in [[b8699 \in {} |-> 0] EXCEPT ![Cardinality({x \in 1..3 : x > 1})] = (3 \div -1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 317 to line 14, col 320 of module random_05627 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 315.
    | Expression starting at line 14, column 315.
    | ExtendableExpr starting at line 14, column 314.
    | Expression starting at line 14, column 314.
    | Except Spec starting at line 14, column 275.
    | Fatal errors while parsing TLA+ spec in file random_05627
    | In module random_05627
    | Could not parse module random_05627 from file random_05627.tla
    | *** Errors: 1
    | In module random_05627
    | Could not parse module random_05627 from file random_05627.tla
    3002:1 Parsing or semantic analysis failed.
---*)
