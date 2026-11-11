(*---
description: Evaluates a random int expression, seed 262, number 6920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) @@ (<<5, 6>> @@ [x \in 1..2 |-> x])) EXCEPT ![(IF [a |-> 1] THEN 0 ELSE 0 - ([a |-> 1]).a)] = CASE (2 \in {2, 1, 3}) -> (1 * -1) [] OTHER -> (3 \div 2147483647)])[LET b10590 == ((<<>> = [x \in Nat |-> x + 1]))[Cardinality(2..1)] IN (Head(<<>>) % (CHOOSE b10591 \in FALSE : b10590))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 189 to line 14, col 189 of module random_06920 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | Case Arm starting at line 14, column 165.
    | Fatal errors while parsing TLA+ spec in file random_06920
    | In module random_06920
    | Could not parse module random_06920 from file random_06920.tla
    | *** Errors: 1
    | In module random_06920
    | Could not parse module random_06920 from file random_06920.tla
    3002:1 Parsing or semantic analysis failed.
---*)
