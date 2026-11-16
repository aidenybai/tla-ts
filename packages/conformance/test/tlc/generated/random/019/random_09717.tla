(*---
description: Evaluates a random function expression, seed 262, number 9717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE) EXCEPT ![(2147483647 \div -1)] = (0 \div 0)] @@ [((1 :> 2) @@ [x \in 1..2 |-> x]) EXCEPT ![[a |-> -1, b |-> [a |-> 1]]] = (<<5, 6>>)[7]]) EXCEPT ![IF (([a |-> 1, b |-> TRUE]).a < (CHOOSE b15076 \in SUBSET {1} : {x \in 1..3 : x > 1})) THEN LET b15077 == (2147483647 % 2147483647) IN (b15077 * -1) ELSE (SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) * Cardinality(1..3))] = Head(<<([a |-> 1, b |-> TRUE]).a, IF TRUE THEN 0 ELSE -1>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 83 to line 14, col 86 of module random_09717 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 72.
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | Except Component starting at line 14, column 70.
    | Fatal errors while parsing TLA+ spec in file random_09717
    | In module random_09717
    | Could not parse module random_09717 from file random_09717.tla
    | *** Errors: 1
    | In module random_09717
    | Could not parse module random_09717 from file random_09717.tla
    3002:1 Parsing or semantic analysis failed.
---*)
