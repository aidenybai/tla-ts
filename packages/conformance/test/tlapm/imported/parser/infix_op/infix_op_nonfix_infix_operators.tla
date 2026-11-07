(*---
description: The syntax corpus case "Nonfix Infix Operators" in infix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/infix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE infix_op_nonfix_infix_operators ----
EXTENDS TestPrelude
op == {
  A!B!&(x, y),
  A!B!&&(x, y),
  A!B!\approx(x, y),
  A!B!:=(x, y),
  A!B!\asymp(x, y),
  A!B!\bigcirc(x, y),
  A!B!::=(x, y),
  A!B!\bullet(x, y),
  A!B!\o(x, y),
  A!B!\circ(x, y),
  A!B!@@(x, y),
  A!B!\cong(x, y),
  A!B!\div(x, y),
  A!B!$(x, y),
  A!B!$$(x, y),
  A!B!\doteq(x, y),
  A!B!..(x, y),
  A!B!...(x, y),
  A!B!>=(x, y),
  A!B!\geq(x, y),
  A!B!\gg(x, y),
  A!B!>(x, y),
  A!B!##(x, y),
  A!B!=|(x, y),
  A!B!<=(x, y),
  A!B!=<(x, y),
  A!B!\leq(x, y),
  A!B!\ll(x, y),
  A!B!-|(x, y),
  A!B!<(x, y),
  A!B!<:(x, y),
  A!B!:>(x, y),
  A!B!-(x, y),
  A!B!--(x, y),
  A!B!%(x, y),
  A!B!%%(x, y),
  A!B!*(x, y),
  A!B!**(x, y),
  A!B!(.)(x, y),
  A!B!\odot(x, y),
  A!B!(-)(x, y),
  A!B!\ominus(x, y),
  A!B!(+)(x, y),
  A!B!\oplus(x, y),
  A!B!(/)(x, y),
  A!B!\oslash(x, y),
  A!B!(\X)(x, y),
  A!B!\otimes(x, y),
  A!B!+(x, y),
  A!B!++(x, y),
  A!B!^(x, y),
  A!B!^^(x, y),
  A!B!\prec(x, y),
  A!B!\preceq(x, y),
  A!B!\propto(x, y),
  A!B!??(x, y),
  A!B!|=(x, y),
  A!B!|-(x, y),
  A!B!\sim(x, y),
  A!B!\simeq(x, y),
  A!B!/(x, y),
  A!B!//(x, y),
  A!B!\sqcap(x, y),
  A!B!\sqcup(x, y),
  A!B!\sqsubset(x, y),
  A!B!\sqsubseteq(x, y),
  A!B!\sqsupset(x, y),
  A!B!\sqsupseteq(x, y),
  A!B!\star(x, y),
  A!B!\subset(x, y),
  A!B!\succ(x, y),
  A!B!\succeq(x, y),
  A!B!\supset(x, y),
  A!B!\supseteq(x, y),
  A!B!\uplus(x, y),
  A!B!|(x, y),
  A!B!||(x, y),
  A!B!\wr(x, y)
}
====
---- MODULE TestPrelude ----
VARIABLES x, y
A == INSTANCE M1
====
---- MODULE M1 ----
B == INSTANCE M2
====
---- MODULE M2 ----
a & b == 0
a && b == 0
a \approx b == 0
a := b == 0
a \asymp b == 0
a \bigcirc b == 0
a ::= b == 0
a \bullet b == 0
a \circ b == 0
a @@ b == 0
a \cong b == 0
a \div b == 0
a $ b == 0
a $$ b == 0
a \doteq b == 0
a .. b == 0
a ... b == 0
a >= b == 0
a \gg b == 0
a > b == 0
a ## b == 0
a =| b == 0
a <= b == 0
a \ll b == 0
a -| b == 0
a < b == 0
a <: b == 0
a :> b == 0
a - b == 0
a -- b == 0
a % b == 0
a %% b == 0
a * b == 0
a ** b == 0
a (.) b == 0
a (-) b == 0
a (+) b == 0
a (/) b == 0
a (\X) b == 0
a + b == 0
a ++ b == 0
a ^ b == 0
a ^^ b == 0
a \prec b == 0
a \preceq b == 0
a \propto b == 0
a ?? b == 0
a |= b == 0
a |- b == 0
a \sim b == 0
a \simeq b == 0
a / b == 0
a // b == 0
a \sqcap b == 0
a \sqcup b == 0
a \sqsubset b == 0
a \sqsubseteq b == 0
a \sqsupset b == 0
a \sqsupseteq b == 0
a \star b == 0
a \subset b == 0
a \succ b == 0
a \succeq b == 0
a \supset b == 0
a \supseteq b == 0
a \uplus b == 0
a | b == 0
a || b == 0
a \wr b == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./infix_op_nonfix_infix_operators.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./infix_op_nonfix_infix_operators.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
