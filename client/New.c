#include <assert.h>
#include <ctype.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* readline();
char* trim(char*);

// Main logic to find the max sum of a good subarray
int get_ans(int n, int k, int* A) {
    int freq[200005] = {0}; // Offset by 100000 to handle negatives
    int distinct = 0;
    int left = 0;
    long long currSum = 0, maxSum = 0;

    for (int right = 0; right < n; right++) {
        int idx = A[right] + 100000;

        if (freq[idx] == 0) distinct++;
        freq[idx]++;
        currSum += A[right];

        while (distinct > k) {
            int lidx = A[left] + 100000;
            freq[lidx]--;
            currSum -= A[left];
            if (freq[lidx] == 0) distinct--;
            left++;
        }

        if (currSum > maxSum) maxSum = currSum;
    }

    return (int)maxSum;
}

int main() {
    int N = atoi(trim(readline()));
    int k = atoi(trim(readline()));

    int A[N];
    for (int j = 0; j < N; j++) {
        A[j] = atoi(trim(readline()));
    }

    int result = get_ans(N, k, A);
    printf("%d\n", result);
    return 0;
}

/* Utility functions. Don't modify these */
char* readline() {
    size_t alloc_length = 1024;
    size_t data_length = 0;
    char* data = malloc(alloc_length);

    while (true) {
        char* cursor = data + data_length;
        if (fgets(cursor, alloc_length - data_length, stdin) == NULL) break;

        data_length += strlen(cursor);
        if (data_length < alloc_length - 1 || data[data_length - 1] == '\n') break;

        alloc_length <<= 1;
        data = realloc(data, alloc_length);
    }

    if (data[data_length - 1] == '\n') data[data_length - 1] = '\0';
    return data;
}

char* trim(char* str) {
    if (str == NULL) return NULL;

    size_t len = strlen(str);
    char *frontp = str;
    char *endp = NULL;

    // If empty string
    if (len == 0) return str;

    endp = str + len - 1;

    // Trim leading spaces
    while (*frontp && isspace((unsigned char)*frontp)) frontp++;

    // If all characters are spaces
    if (frontp > endp) {
        str[0] = '\0';
        return str;
    }

    // Trim trailing spaces
    while (endp > frontp && isspace((unsigned char)*endp)) endp--;

    // Null terminate after last non-space
    *(endp + 1) = '\0';

    // Shift trimmed string to the beginning of str
    if (frontp != str) {
        memmove(str, frontp, endp - frontp + 2);  // +1 for null terminator
    }

    return str;
}


