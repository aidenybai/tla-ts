(*---
description: Evaluates a random bool expression, seed 262, number 2455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b3865 \in {b3866 \in {} : <<1, 2>>} : (FALSE <=> FALSE)) /\ ((<<1, 2>> = [x \in 1..2 |-> x]) <=> ({2, 1, 3} \subseteq SUBSET {1}))) => (\A b3867 \in ((1..3 .. 2) \ DOMAIN <<5, 6>>) : ((TRUE => FALSE) /\ (<<3, 1, 2>> = [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 174 to line 14, col 175 of module random_02455 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 176.
    | ExtendableExpr starting at line 14, column 173.
    | Expression starting at line 14, column 173.
    | ExtendableExpr starting at line 14, column 172.
    | Expression starting at line 14, column 172.
    | Fatal errors while parsing TLA+ spec in file random_02455
    | In module random_02455
    | Could not parse module random_02455 from file random_02455.tla
    | *** Errors: 1
    | In module random_02455
    | Could not parse module random_02455 from file random_02455.tla
    3002:1 Parsing or semantic analysis failed.
---*)
