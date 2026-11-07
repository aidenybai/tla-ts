(*---
description: Evaluates a random record expression, seed 262, number 7562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (7 .. 1), b |-> (<<3, 1, 2>> = [x \in 1..2 |-> x])] EXCEPT !.a = @ + DOMAIN (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE)] EXCEPT !.a = @ + IF ((FALSE \/ TRUE) <=> (<<1>> = [x \in Nat |-> x + 1])) THEN ((0 * -1) * (-1 \div <<1, 2>>)) ELSE Head(Append(<<1>>, 3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 227 to line 14, col 227 of module random_07562 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 225.
    | Expression starting at line 14, column 225.
    | ExtendableExpr starting at line 14, column 224.
    | Expression starting at line 14, column 224.
    | ExtendableExpr starting at line 14, column 223.
    | Fatal errors while parsing TLA+ spec in file random_07562
    | In module random_07562
    | Could not parse module random_07562 from file random_07562.tla
    | *** Errors: 1
    | In module random_07562
    | Could not parse module random_07562 from file random_07562.tla
    3002:1 Parsing or semantic analysis failed.
---*)
