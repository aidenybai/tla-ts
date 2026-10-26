---- MODULE Alias_TTrace_1793058767 ----
EXTENDS Sequences, TLCExt, Alias, Toolbox, Naturals, TLC

_expression ==
    LET Alias_TEExpression == INSTANCE Alias_TEExpression
    IN Alias_TEExpression!expression
----

_trace ==
    LET Alias_TETrace == INSTANCE Alias_TETrace
    IN Alias_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        x = (4)
        /\
        y = (TRUE)
    )
----

_init ==
    /\ x = _TETrace[1].x
    /\ y = _TETrace[1].y
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ x  = _TETrace[i].x
        /\ x' = _TETrace[j].x
        /\ y  = _TETrace[i].y
        /\ y' = _TETrace[j].y

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("Alias_TTrace_1793058767.json", _TETrace)

=============================================================================

 Note that you can extract this module `Alias_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Alias_TEExpression.tla` file takes precedence 
  over the module `Alias_TEExpression` below).

---- MODULE Alias_TEExpression ----
EXTENDS Sequences, TLCExt, Alias, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `Alias` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        x |-> x
        ,y |-> y
        
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
\*---- MODULE Alias_TETrace ----
\*EXTENDS IOUtils, Alias, TLC
\*
\*trace == IODeserialize("Alias_TTrace_1793058767.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Alias_TETrace ----
EXTENDS Alias, TLC

trace == 
    <<
    ([x |-> 1,y |-> FALSE]),
    ([x |-> 2,y |-> TRUE]),
    ([x |-> 3,y |-> FALSE]),
    ([x |-> 4,y |-> TRUE])
    >>
----


=============================================================================

---- CONFIG Alias_TTrace_1793058767 ----

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
\* Generated on Mon Oct 26 16:52:47 PDT 2026