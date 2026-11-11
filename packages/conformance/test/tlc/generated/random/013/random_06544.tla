(*---
description: Evaluates a random function expression, seed 262, number 6544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b10060 \in (1 .. -1) |-> (-b10060)] EXCEPT ![([a |-> 0, b |-> TRUE] % (3 + 3))] = LET b10061 == (7 * -1) IN (-1)] @@ ([(TRUE :> 3) EXCEPT ![IF TRUE THEN 3 ELSE 2147483647] = Len([x \in Nat |-> x + 1])] @@ ((CHOOSE b10062 \in [a |-> 1, b |-> TRUE] : TRUE) :> ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 118 to line 14, col 118 of module random_06544 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 116.
    | Expression starting at line 14, column 116.
    | ExtendableExpr starting at line 14, column 115.
    | Expression starting at line 14, column 115.
    | Definition starting at line 14, column 105.
    | Fatal errors while parsing TLA+ spec in file random_06544
    | In module random_06544
    | Could not parse module random_06544 from file random_06544.tla
    | *** Errors: 1
    | In module random_06544
    | Could not parse module random_06544 from file random_06544.tla
    3002:1 Parsing or semantic analysis failed.
---*)
