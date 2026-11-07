(*---
description: Evaluates a random function expression, seed 262, number 5546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8579 \in ({(2147483647 \div -1), (-7)} \ (DOMAIN <<5, 6>> \ ({x \in 1..3 : x > 1} \cup 1..3))) |-> CASE (Len(<<1, 2>>) \in ({} \ Nat)) -> (Len(<<3, 1, 2>>) % Cardinality({1})) [] OTHER -> (CHOOSE b8580 \in ({} \cup Nat) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 41 to line 14, col 44 of module random_05546 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | ExtendableExpr starting at line 14, column 29.
    | Expression starting at line 14, column 29.
    | Some { } form starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_05546
    | In module random_05546
    | Could not parse module random_05546 from file random_05546.tla
    | *** Errors: 1
    | In module random_05546
    | Could not parse module random_05546 from file random_05546.tla
    3002:1 Parsing or semantic analysis failed.
---*)
