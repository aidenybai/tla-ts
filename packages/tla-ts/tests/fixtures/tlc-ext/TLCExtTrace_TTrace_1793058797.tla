---- MODULE TLCExtTrace_TTrace_1793058797 ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, TLCExtTrace

_expression ==
    LET TLCExtTrace_TEExpression == INSTANCE TLCExtTrace_TEExpression
    IN TLCExtTrace_TEExpression!expression
----

_trace ==
    LET TLCExtTrace_TETrace == INSTANCE TLCExtTrace_TETrace
    IN TLCExtTrace_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        x = (10)
    )
----

_init ==
    /\ x = _TETrace[1].x
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ x  = _TETrace[i].x
        /\ x' = _TETrace[j].x

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("TLCExtTrace_TTrace_1793058797.json", _TETrace)

=============================================================================

 Note that you can extract this module `TLCExtTrace_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `TLCExtTrace_TEExpression.tla` file takes precedence 
  over the module `TLCExtTrace_TEExpression` below).

---- MODULE TLCExtTrace_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, TLCExtTrace

expression == 
    [
        \* To hide variables of the `TLCExtTrace` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        x |-> x
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_xUnchanged |-> x = x'
        
        \* Format the `x` variable as Json value.
        \* ,_xJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(x)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_xModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].x # _TETrace[s-1].x
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE TLCExtTrace_TETrace ----
\*EXTENDS IOUtils, TLC, TLCExtTrace
\*
\*trace == IODeserialize("TLCExtTrace_TTrace_1793058797.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE TLCExtTrace_TETrace ----
EXTENDS TLC, TLCExtTrace

trace == 
    <<
    ([x |-> 1]),
    ([x |-> 2]),
    ([x |-> 3]),
    ([x |-> 4]),
    ([x |-> 5]),
    ([x |-> 6]),
    ([x |-> 7]),
    ([x |-> 8]),
    ([x |-> 9]),
    ([x |-> 10])
    >>
----


=============================================================================

---- CONFIG TLCExtTrace_TTrace_1793058797 ----

INVARIANT
    _inv

CHECK_DEADLOCK
    \* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.
    FALSE

INIT
    _init

NEXT
    _next

CONSTANT
    _TETrace <- _trace

ALIAS
    _expression
=============================================================================
\* Generated on Mon Oct 26 16:53:17 PDT 2026